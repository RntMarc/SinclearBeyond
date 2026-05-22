import crypto from "node:crypto";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { db, safeQuery } from "@/lib/db/db";
import { passkeys, users, webauthnChallenges } from "@/lib/db/schema";

const RP_ID = process.env.NEXT_PUBLIC_RP_ID || "localhost";
const RP_NAME = "Sinclear Beyond";
let ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || "http://localhost:3000";
if (ORIGIN && !ORIGIN.startsWith("http://") && !ORIGIN.startsWith("https://")) {
  ORIGIN = `https://${ORIGIN}`;
}

/**
 * Purge expired challenges
 */
async function purgeExpiredChallenges() {
  await safeQuery(
    db
      .delete(webauthnChallenges)
      .where(lt(webauthnChallenges.expiresAt, new Date())),
  );
}

/**
 * Registration: Step 1 - Options
 */
export async function getRegistrationOptions(user) {
  await purgeExpiredChallenges();

  const { data: userPasskeys, error } = await safeQuery(
    db.select().from(passkeys).where(eq(passkeys.userId, user.id)),
  );
  if (error) throw error;

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    // v13: userID must be Uint8Array
    userID: new TextEncoder().encode(user.id),
    userName: user.email,
    userDisplayName: user.displayName,
    excludeCredentials: (userPasskeys || []).map((pk) => ({
      id: pk.credentialId,
      type: "public-key",
      transports: pk.transports ? JSON.parse(pk.transports) : undefined,
    })),
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "preferred",
    },
  });

  const { error: inErr } = await safeQuery(
    db.insert(webauthnChallenges).values({
      id: crypto.randomUUID(),
      challenge: options.challenge,
      userId: user.id,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      createdAt: new Date(),
    }),
  );
  if (inErr) throw inErr;

  return options;
}

/**
 * Registration: Step 2 - Verify
 */
export async function verifyRegistration(userId, body, name) {
  const clientData = JSON.parse(
    Buffer.from(body.response.clientDataJSON, "base64url").toString(),
  );
  const challenge = clientData.challenge;

  const { data: challenges, error: fetchErr } = await safeQuery(
    db
      .select()
      .from(webauthnChallenges)
      .where(
        and(
          eq(webauthnChallenges.userId, userId),
          eq(webauthnChallenges.challenge, challenge),
          // Verify challenge hasn't expired
          gt(webauthnChallenges.expiresAt, new Date()),
        ),
      )
      .limit(1),
  );

  if (fetchErr) throw fetchErr;
  const challengeEntry = challenges?.[0];

  if (!challengeEntry) {
    throw new Error("Challenge nicht gefunden oder abgelaufen.");
  }

  // Always delete challenge first — prevents replay regardless of outcome
  await safeQuery(
    db
      .delete(webauthnChallenges)
      .where(eq(webauthnChallenges.id, challengeEntry.id)),
  );

  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge: challengeEntry.challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  });

  if (verification.verified) {
    // v13: credential info is nested under registrationInfo.credential
    const { credential } = verification.registrationInfo;

    const { error: inErr } = await safeQuery(
      db.insert(passkeys).values({
        id: crypto.randomUUID(),
        userId,
        name: name || "Passkey",
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString("base64url"),
        counter: credential.counter,
        transports: JSON.stringify(body.response.transports || []),
        createdAt: new Date(),
      }),
    );
    if (inErr) throw inErr;
  }

  return verification;
}

/**
 * Authentication: Step 1 - Options
 */
export async function getAuthenticationOptions() {
  await purgeExpiredChallenges();

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: "preferred",
  });

  // userId intentionally null — discoverable credential, user unknown at this point
  const { error: inErr } = await safeQuery(
    db.insert(webauthnChallenges).values({
      id: crypto.randomUUID(),
      challenge: options.challenge,
      userId: null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      createdAt: new Date(),
    }),
  );
  if (inErr) throw inErr;

  return options;
}

/**
 * Authentication: Step 2 - Verify
 */
export async function verifyAuthentication(body) {
  const clientData = JSON.parse(
    Buffer.from(body.response.clientDataJSON, "base64url").toString(),
  );
  const challenge = clientData.challenge;

  const { data: challenges, error: fetchErr } = await safeQuery(
    db
      .select()
      .from(webauthnChallenges)
      .where(
        and(
          eq(webauthnChallenges.challenge, challenge),
          // Only match login challenges (userId IS NULL) — prevents collision with registration challenges
          isNull(webauthnChallenges.userId),
          // Verify challenge hasn't expired
          gt(webauthnChallenges.expiresAt, new Date()),
        ),
      )
      .limit(1),
  );

  if (fetchErr) throw fetchErr;
  const challengeEntry = challenges?.[0];

  if (!challengeEntry) {
    throw new Error("Challenge nicht gefunden oder abgelaufen.");
  }

  // Always delete challenge first — prevents replay regardless of outcome
  await safeQuery(
    db
      .delete(webauthnChallenges)
      .where(eq(webauthnChallenges.id, challengeEntry.id)),
  );

  const credId = body.id;
  const { data: pkeys, error: pkErr } = await safeQuery(
    db
      .select()
      .from(passkeys)
      .where(eq(passkeys.credentialId, credId))
      .limit(1),
  );

  if (pkErr) throw pkErr;
  const passkey = pkeys?.[0];

  if (!passkey) {
    throw new Error("Passkey unbekannt.");
  }

  const verification = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge: challengeEntry.challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    // v13: uses `credential` key, not `authenticator`
    credential: {
      id: passkey.credentialId,
      publicKey: Buffer.from(passkey.publicKey, "base64url"),
      counter: passkey.counter,
      transports: passkey.transports ? JSON.parse(passkey.transports) : [],
    },
  });

  if (verification.verified) {
    const { newCounter } = verification.authenticationInfo;

    const { error: upErr } = await safeQuery(
      db
        .update(passkeys)
        .set({ counter: newCounter, lastUsedAt: new Date() })
        .where(eq(passkeys.id, passkey.id)),
    );
    if (upErr) throw upErr;

    const { data: usersData, error: uErr } = await safeQuery(
      db.select().from(users).where(eq(users.id, passkey.userId)).limit(1),
    );
    if (uErr) throw uErr;

    return { verified: true, user: usersData?.[0] };
  }

  return { verified: false };
}

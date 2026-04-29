import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@/lib/db/db";
import { passkeys, webauthnChallenges, users } from "@/lib/db/schema";

const RP_ID = process.env.NEXT_PUBLIC_RP_ID || "localhost";
const RP_NAME = "Sinclear Beyond";
const ORIGIN = process.env.NEXT_PUBLIC_ORIGIN || "http://localhost:3000";

/**
 * Purge expired challenges
 */
async function purgeExpiredChallenges() {
  await db
    .delete(webauthnChallenges)
    .where(lt(webauthnChallenges.expiresAt, new Date()));
}

/**
 * Registration: Step 1 - Options
 */
export async function getRegistrationOptions(user) {
  await purgeExpiredChallenges();

  const userPasskeys = await db
    .select()
    .from(passkeys)
    .where(eq(passkeys.userId, user.id));

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    // v13: userID must be Uint8Array
    userID: new TextEncoder().encode(user.id),
    userName: user.email,
    userDisplayName: user.displayName,
    excludeCredentials: userPasskeys.map((pk) => ({
      id: pk.credentialId,
      type: "public-key",
      transports: pk.transports ? JSON.parse(pk.transports) : undefined,
    })),
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "preferred",
    },
  });

  await db.insert(webauthnChallenges).values({
    id: crypto.randomUUID(),
    challenge: options.challenge,
    userId: user.id,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    createdAt: new Date(),
  });

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

  const [challengeEntry] = await db
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
    .limit(1);

  if (!challengeEntry) {
    throw new Error("Challenge nicht gefunden oder abgelaufen.");
  }

  // Always delete challenge first — prevents replay regardless of outcome
  await db
    .delete(webauthnChallenges)
    .where(eq(webauthnChallenges.id, challengeEntry.id));

  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge: challengeEntry.challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  });

  if (verification.verified) {
    // v13: credential info is nested under registrationInfo.credential
    const { credential } = verification.registrationInfo;

    await db.insert(passkeys).values({
      id: crypto.randomUUID(),
      userId,
      name: name || "Passkey",
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString("base64url"),
      counter: credential.counter,
      transports: JSON.stringify(body.response.transports || []),
      createdAt: new Date(),
    });
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
  await db.insert(webauthnChallenges).values({
    id: crypto.randomUUID(),
    challenge: options.challenge,
    userId: null,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    createdAt: new Date(),
  });

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

  const [challengeEntry] = await db
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
    .limit(1);

  if (!challengeEntry) {
    throw new Error("Challenge nicht gefunden oder abgelaufen.");
  }

  // Always delete challenge first — prevents replay regardless of outcome
  await db
    .delete(webauthnChallenges)
    .where(eq(webauthnChallenges.id, challengeEntry.id));

  const credId = body.id;
  const [passkey] = await db
    .select()
    .from(passkeys)
    .where(eq(passkeys.credentialId, credId))
    .limit(1);

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

    await db
      .update(passkeys)
      .set({ counter: newCounter, lastUsedAt: new Date() })
      .where(eq(passkeys.id, passkey.id));

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, passkey.userId))
      .limit(1);

    return { verified: true, user };
  }

  return { verified: false };
}

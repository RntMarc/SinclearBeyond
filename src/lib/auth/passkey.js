import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { and, eq, lt } from "drizzle-orm";
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
    userID: user.id,
    userName: user.email,
    userDisplayName: user.displayName,
    // Prevent re-registering the same authenticator
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

  // Store challenge
  await db.insert(webauthnChallenges).values({
    id: crypto.randomUUID(),
    challenge: options.challenge,
    userId: user.id,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    createdAt: new Date(),
  });

  return options;
}

/**
 * Registration: Step 2 - Verify
 */
export async function verifyRegistration(userId, body, name) {
  // We decode the clientDataJSON to get the challenge
  const clientData = JSON.parse(
    Buffer.from(body.response.clientDataJSON, "base64").toString(),
  );
  const challenge = clientData.challenge;

  const [challengeEntry] = await db
    .select()
    .from(webauthnChallenges)
    .where(
      and(
        eq(webauthnChallenges.userId, userId),
        eq(webauthnChallenges.challenge, challenge),
      ),
    )
    .limit(1);

  if (!challengeEntry) {
    throw new Error("Challenge nicht gefunden oder abgelaufen.");
  }

  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge: challengeEntry.challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  });

  if (verification.verified) {
    const { registrationInfo } = verification;
    const { credentialPublicKey, credentialID, counter } = registrationInfo;

    // Save passkey
    await db.insert(passkeys).values({
      id: crypto.randomUUID(),
      userId,
      name: name || "Passkey",
      credentialId: Buffer.from(credentialID).toString("base64url"),
      publicKey: Buffer.from(credentialPublicKey).toString("base64url"),
      counter,
      transports: JSON.stringify(body.response.transports || []),
      createdAt: new Date(),
    });

    // Cleanup challenge
    await db
      .delete(webauthnChallenges)
      .where(eq(webauthnChallenges.id, challengeEntry.id));
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
    // discoverable credentials (resident keys) allow login without typing email first
  });

  // Store challenge (no userId yet for discoverable credentials)
  await db.insert(webauthnChallenges).values({
    id: crypto.randomUUID(),
    challenge: options.challenge,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    createdAt: new Date(),
  });

  return options;
}

/**
 * Authentication: Step 2 - Verify
 */
export async function verifyAuthentication(body) {
  // We decode the clientDataJSON to get the challenge
  const clientData = JSON.parse(
    Buffer.from(body.response.clientDataJSON, "base64").toString(),
  );
  const challenge = clientData.challenge;

  const [challengeEntry] = await db
    .select()
    .from(webauthnChallenges)
    .where(eq(webauthnChallenges.challenge, challenge))
    .limit(1);

  if (!challengeEntry) {
    throw new Error("Challenge nicht gefunden oder abgelaufen.");
  }

  // For discoverable credentials, we find the user by credentialId
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
    authenticator: {
      credentialID: Buffer.from(passkey.credentialId, "base64url"),
      credentialPublicKey: Buffer.from(passkey.publicKey, "base64url"),
      counter: passkey.counter,
    },
  });

  if (verification.verified) {
    const { authenticationInfo } = verification;
    const { newCounter } = authenticationInfo;

    // Update counter and lastUsed
    await db
      .update(passkeys)
      .set({ counter: newCounter, lastUsedAt: new Date() })
      .where(eq(passkeys.id, passkey.id));

    // Cleanup challenge
    await db
      .delete(webauthnChallenges)
      .where(eq(webauthnChallenges.id, challengeEntry.id));

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, passkey.userId))
      .limit(1);
    return { verified: true, user };
  }

  return { verified: false };
}

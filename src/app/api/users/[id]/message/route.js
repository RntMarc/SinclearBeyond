import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyToken } from "@/lib/auth/auth";
import { db, safeQuery } from "@/lib/db/db";
import { users } from "@/lib/db/schema";
import { transport } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";

const MessageSchema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
});

export async function POST(req, { params }) {
  const { id: recipientId } = await params;
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

  // Rate limit: 3 messages per 10 minutes
  if (!rateLimit(ip, 3, 600000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const token = req.cookies.get("session")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payload = await verifyToken(token);
    const senderId = payload.sub;

    if (senderId === recipientId) {
      return NextResponse.json(
        { error: "You cannot send a message to yourself" },
        { status: 400 },
      );
    }

    const rawBody = await req.json();
    const result = MessageSchema.safeParse(rawBody);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 },
      );
    }

    const { subject, message } = result.data;

    // Fetch recipient email
    const { data: recData, error: recErr } = await safeQuery(
      db
        .select({
          email: users.email,
          displayName: users.displayName,
        })
        .from(users)
        .where(eq(users.id, recipientId))
        .limit(1),
    );
    if (recErr) throw recErr;
    const recipient = recData?.[0];

    if (!recipient) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch sender info
    const { data: senderData, error: senderErr } = await safeQuery(
      db
        .select({
          displayName: users.displayName,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, senderId))
        .limit(1),
    );
    if (senderErr) throw senderErr;
    const sender = senderData?.[0];

    if (!sender) {
      return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    }

    await transport.sendMail({
      from: process.env.SMTP_FROM,
      to: recipient.email,
      replyTo: sender.email,
      subject: `[Sinclear Beyond] Nachricht von ${sender.displayName}: ${subject}`,
      text: `Hallo ${recipient.displayName},\n\ndu hast eine Nachricht von ${sender.displayName} über Sinclear Beyond erhalten.\n\nBetreff: ${subject}\n\nNachricht:\n${message}\n\n---\nDu kannst direkt auf diese E-Mail antworten, um ${sender.displayName} zu kontaktieren.`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:var(--card);">
          <h2 style="font-weight:300;color:#000;">Neue Nachricht erhalten</h2>
          <p>Hallo <strong>${recipient.displayName}</strong>,</p>
          <p>du hast eine Nachricht von <strong>${sender.displayName}</strong> über Sinclear Beyond erhalten.</p>

          <div style="background:var(--foreground);border-left:4px solid var(--primary);padding:16px;margin:24px 0;">
            <p style="margin:0 0 8px 0;font-weight:bold;font-size:12px;text-transform:uppercase;color:#666;">Betreff</p>
            <p style="margin:0 0 16px 0;font-size:16px;">${subject}</p>

            <p style="margin:0 0 8px 0;font-weight:bold;font-size:12px;text-transform:uppercase;color:#666;">Nachricht</p>
            <p style="margin:0;white-space:pre-wrap;line-height:1.5;">${message}</p>
          </div>

          <p style="font-size:14px;color:#666;">
            Du kannst direkt auf diese E-Mail antworten, um mit ${sender.displayName} in Kontakt zu treten.
          </p>
          <hr style="border:0;border-top:1px solid var(--foreground);margin:32px 0" />
          <p style="font-size:12px;color:#999;text-align:center;">
            Dies ist eine automatisch generierte Nachricht von Sinclear Beyond.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

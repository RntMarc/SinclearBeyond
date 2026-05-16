import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";
import { verifyToken } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { feedbackSuggestions, feedbackVotes, users } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";

const FeedbackSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("feedback"),
    message: z.string().min(1).max(5000),
  }),
  z.object({
    type: z.literal("suggestion"),
    title: z.string().min(1).max(100),
    description: z.string().max(2000).optional(),
  }),
  z.object({
    type: z.literal("missing_place"),
    name: z.string().max(200).optional(),
    address: z.string().max(500).optional(),
    googleMapsLink: z.string().max(500).optional(),
    website: z.string().max(500).optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
  }),
]);

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function GET(req) {
  const token = req.cookies.get("session")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payload = await verifyToken(token);
    const userId = payload.sub;

    // Fetch suggestions with upvote count and whether the current user has upvoted
    const suggestions = await db
      .select({
        id: feedbackSuggestions.id,
        userId: feedbackSuggestions.userId,
        userDisplayName: users.displayName,
        userImage: users.image,
        title: feedbackSuggestions.title,
        description: feedbackSuggestions.description,
        status: feedbackSuggestions.status,
        createdAt: feedbackSuggestions.createdAt,
        updatedAt: feedbackSuggestions.updatedAt,
        upvotes: sql`count(${feedbackVotes.id})`.mapWith(Number),
        hasUpvoted:
          sql`max(case when ${feedbackVotes.userId} = ${userId} then 1 else 0 end)`.mapWith(
            Boolean,
          ),
      })
      .from(feedbackSuggestions)
      .leftJoin(users, eq(feedbackSuggestions.userId, users.id))
      .leftJoin(
        feedbackVotes,
        eq(feedbackSuggestions.id, feedbackVotes.suggestionId),
      )
      .groupBy(
        feedbackSuggestions.id,
        feedbackSuggestions.userId,
        users.displayName,
        users.image,
        feedbackSuggestions.title,
        feedbackSuggestions.description,
        feedbackSuggestions.status,
        feedbackSuggestions.createdAt,
        feedbackSuggestions.updatedAt,
      )
      .orderBy(
        desc(sql`count(${feedbackVotes.id})`),
        desc(feedbackSuggestions.createdAt),
      );

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  if (!rateLimit(ip, 5, 60000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const token = req.cookies.get("session")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payload = await verifyToken(token);
    const userId = payload.sub;

    const rawBody = await req.json();
    const result = FeedbackSchema.safeParse(rawBody);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 },
      );
    }

    const body = result.data;

    if (body.type === "feedback") {
      // Send general feedback email
      const { message } = body;

      await transport.sendMail({
        from: process.env.SMTP_FROM,
        to: process.env.FEEDBACK_EMAIL,
        subject: `Neues Feedback von ${payload.email}`,
        text: `Feedback von: ${payload.email} (ID: ${userId})\n\nNachricht:\n${message}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="font-weight:300">Neues Feedback erhalten</h2>
            <p><strong>Von:</strong> ${payload.email} (ID: ${userId})</p>
            <hr style="border:0;border-top:1px solid #eee;margin:20px 0" />
            <p style="white-space:pre-wrap">${message}</p>
          </div>
        `,
      });

      return NextResponse.json({ success: true });
    } else if (body.type === "suggestion") {
      // Create new feature suggestion
      const { title, description } = body;

      const newId = crypto.randomUUID();
      await db.insert(feedbackSuggestions).values({
        id: newId,
        userId,
        title,
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return NextResponse.json({ id: newId });
    } else if (body.type === "missing_place") {
      const { name, address, googleMapsLink, website, latitude, longitude } =
        body;

      await transport.sendMail({
        from: process.env.SMTP_FROM,
        to: process.env.FEEDBACK_EMAIL,
        subject: `Fehlender Ort gemeldet von ${payload.email}`,
        text: `Vermisster Ort gemeldet von: ${payload.email} (ID: ${userId})\n\nDetails:\nName: ${name || "-"}\nAdresse: ${address || "-"}\nGoogle Maps: ${googleMapsLink || "-"}\nWebseite: ${website || "-"}\nKoordinaten: ${latitude && longitude ? `${latitude}, ${longitude}` : "-"}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="font-weight:300">Fehlender Ort gemeldet</h2>
            <p><strong>Von:</strong> ${payload.email} (ID: ${userId})</p>
            <hr style="border:0;border-top:1px solid #eee;margin:20px 0" />
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px 0;font-weight:bold;width:120px">Name:</td><td>${name || "-"}</td></tr>
              <tr><td style="padding:8px 0;font-weight:bold">Adresse:</td><td>${address || "-"}</td></tr>
              <tr><td style="padding:8px 0;font-weight:bold">Google Maps:</td><td>${googleMapsLink ? `<a href="${googleMapsLink}">${googleMapsLink}</a>` : "-"}</td></tr>
              <tr><td style="padding:8px 0;font-weight:bold">Webseite:</td><td>${website ? `<a href="${website}">${website}</a>` : "-"}</td></tr>
              <tr><td style="padding:8px 0;font-weight:bold">Koordinaten:</td><td>${latitude && longitude ? `${latitude}, ${longitude}` : "-"}</td></tr>
            </table>
          </div>
        `,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid request type" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error processing feedback/suggestion:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

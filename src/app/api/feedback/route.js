import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { verifyToken } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { feedbackSuggestions, feedbackVotes } from "@/lib/db/schema";

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
      .leftJoin(
        feedbackVotes,
        eq(feedbackSuggestions.id, feedbackVotes.suggestionId),
      )
      .groupBy(
        feedbackSuggestions.id,
        feedbackSuggestions.userId,
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
  const token = req.cookies.get("session")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const payload = await verifyToken(token);
    const userId = payload.sub;
    const body = await req.json();

    if (body.type === "feedback") {
      // Send general feedback email
      const { message } = body;
      if (!message)
        return NextResponse.json(
          { error: "Message is required" },
          { status: 400 },
        );

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
      if (!title)
        return NextResponse.json(
          { error: "Title is required" },
          { status: 400 },
        );

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

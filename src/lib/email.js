console.log("[SMTP] module loaded, host:", process.env.SMTP_HOST);

import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify on module load — logs misconfiguration immediately at startup
transport.verify().catch((err) => {
  console.error("[SMTP] Transport verification failed:", err.message);
});

export async function sendOtpEmail(to, code) {
  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "Dein Sinclear-Code",
    text: `Dein Anmeldecode: ${code}\n\nGültig für 10 Minuten.`,
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto">
        <h2 style="font-weight:300">Dein Anmeldecode</h2>
        <p style="font-size:2rem;letter-spacing:.3em;font-weight:600">${code}</p>
        <p style="color:#888;font-size:.875rem">Gültig für 10 Minuten. Nicht angefordert? Ignorieren.</p>
      </div>
    `,
  });
}

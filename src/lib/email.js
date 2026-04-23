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

export async function sendOtpEmail(to, code) {
  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "Dein Code für Sinclear Beyond",
    text: `Dein Anmeldecode: ${code}\n\nGültig für 10 Minuten.\n\n\nNicht angefordert? Ignorieren.`,
  });
}

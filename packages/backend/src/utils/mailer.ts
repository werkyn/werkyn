import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter: nodemailer.Transporter;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  if (env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  } else {
    // Use Ethereal test account in development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return transporter;
}

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  try {
    const transport = await getTransporter();
    const verifyUrl = `${env.FRONTEND_URL}/verify-email/${token}`;

    const info = await transport.sendMail({
      from: env.SMTP_FROM,
      to,
      subject: "Verify your email address",
      text: `Please verify your email address by clicking the link below:\n\n${verifyUrl}\n\nThis link will expire in 24 hours.`,
      html: `<p>Please verify your email address by clicking the link below:</p><p><a href="${verifyUrl}">Verify Email</a></p><p>This link will expire in 24 hours.</p>`,
    });

    if (env.NODE_ENV === "development") {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log("Preview URL:", previewUrl);
      }
    }
  } catch (error) {
    console.error("Failed to send verification email:", error);
  }
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
): Promise<void> {
  try {
    const transport = await getTransporter();
    const resetUrl = `${env.FRONTEND_URL}/reset-password/${token}`;

    const info = await transport.sendMail({
      from: env.SMTP_FROM,
      to,
      subject: "Reset your password",
      text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you didn't request this, you can ignore this email.`,
      html: `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetUrl}">Reset Password</a></p><p>This link will expire in 1 hour. If you didn't request this, you can ignore this email.</p>`,
    });

    if (env.NODE_ENV === "development") {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log("Preview URL:", previewUrl);
      }
    }
  } catch (error) {
    console.error("Failed to send password reset email:", error);
  }
}

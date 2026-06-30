import nodemailer from 'nodemailer';
import { env } from '../config/env';
import logger from '../lib/logger';

export class MailerService {
  private static transporter = (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS)
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT ? Number(env.SMTP_PORT) : 587,
        secure: env.SMTP_PORT === '465',
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      })
    : null;

  static async sendMagicLinkEmail(toEmail: string, loginUrl: string): Promise<void> {
    const from = env.SMTP_FROM || env.SMTP_USER || '"CodeVault" <noreply@codevault.io>';
    const subject = '🔑 Sign in to CodeVault';
    const html = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0dcd0; border-radius: 8px; background: #fffcf5;">
        <h2 style="color: #f1543f; margin-top: 0;">CodeVault Login Request</h2>
        <p style="color: #4a483f; line-height: 1.6;">Click the button below to sign in securely to your CodeVault account. This link will expire in 15 minutes.</p>
        <div style="margin: 24px 0; text-align: center;">
          <a href="${loginUrl}" style="display: inline-block; background-color: #f1543f; color: white; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 6px;">Sign In to CodeVault</a>
        </div>
        <p style="color: #6f6d61; font-size: 13px;">If you didn't request this email, you can safely ignore it.</p>
        <hr style="border: 0; border-top: 1px solid #e0dcd0; margin: 20px 0;" />
        <p style="color: #9c9a8e; font-size: 11px; word-break: break-all;">Button not working? Copy and paste this link into your browser:<br/>${loginUrl}</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to: toEmail,
          subject,
          html,
        });
        logger.info({ to: toEmail }, 'Magic link email sent successfully via SMTP');
      } catch (error) {
        logger.error(error, 'Failed to send magic link email via SMTP');
        throw new Error('Failed to send login email. Please try again.');
      }
    } else {
      // In development / fallback mode when SMTP is not configured
      logger.warn('⚠️ SMTP credentials not fully configured in env. Falling back to console logging.');
      logger.info(`
=========================================
🔑 PASSWORDLESS EMAIL MAGIC LINK
Recipient: ${toEmail}
Login URL: ${loginUrl}
=========================================
      `);
    }
  }
}

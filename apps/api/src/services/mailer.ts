import nodemailer from 'nodemailer';
import { config } from '../config.js';

/** Envoi d'emails transactionnels (codes de réinitialisation). Actif seulement si SMTP_HOST est défini. */
let transporter: nodemailer.Transporter | null = null;

export function isMailConfigured(): boolean {
  return Boolean(config.smtp.host && config.smtp.from);
}

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.password } : undefined,
    });
  }
  return transporter;
}

export async function sendMail(to: string, subject: string, text: string): Promise<void> {
  if (!isMailConfigured()) throw new Error('Messagerie non configurée (SMTP_HOST / SMTP_FROM).');
  await getTransporter().sendMail({ from: config.smtp.from, to, subject, text });
}

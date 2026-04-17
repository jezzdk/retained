import { sendEmail, studyReminderHtml, studyReminderText, finalTestEmailHtml, finalTestEmailText } from './email';
import type { Env } from './types';

interface ScheduleRow {
  id: string;
  email: string;
  url: string;
}

export async function runCron(env: Env): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  const studyRows = await env.DB.prepare(
    'SELECT id, email, url FROM schedules WHERE study_sent = 0 AND study_at <= ? AND completed_at IS NULL'
  )
    .bind(now)
    .all<ScheduleRow>();

  for (const row of studyRows.results) {
    try {
      const articleDomain = new URL(row.url).hostname.replace(/^www\./, '');
      const studiedUrl = `${env.APP_URL}/studied?id=${row.id}`;

      await sendEmail({
        apiKey: env.RESEND_API_KEY,
        from: `${env.FROM_NAME} <${env.FROM_EMAIL}>`,
        to: row.email,
        subject: `Time to study — ${articleDomain}`,
        html: studyReminderHtml(row.url, articleDomain, studiedUrl),
        text: studyReminderText(row.url, studiedUrl),
      });

      await env.DB.prepare('UPDATE schedules SET study_sent = 1 WHERE id = ?').bind(row.id).run();
    } catch (err) {
      console.error(`Failed to send study reminder for schedule ${row.id}:`, err);
    }
  }

  const testRows = await env.DB.prepare(
    'SELECT id, email FROM schedules WHERE test_sent = 0 AND test_at <= ? AND studied_at IS NOT NULL AND completed_at IS NULL'
  )
    .bind(now)
    .all<{ id: string; email: string }>();

  for (const row of testRows.results) {
    try {
      const finalUrl = `${env.APP_URL}/final?id=${row.id}`;

      await sendEmail({
        apiKey: env.RESEND_API_KEY,
        from: `${env.FROM_NAME} <${env.FROM_EMAIL}>`,
        to: row.email,
        subject: 'Your final test is ready',
        html: finalTestEmailHtml(finalUrl),
        text: finalTestEmailText(finalUrl),
      });

      await env.DB.prepare('UPDATE schedules SET test_sent = 1 WHERE id = ?').bind(row.id).run();
    } catch (err) {
      console.error(`Failed to send final test email for schedule ${row.id}:`, err);
    }
  }
}

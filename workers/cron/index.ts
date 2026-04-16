import {
  sendEmail,
  studyReminderHtml,
  studyReminderText,
  finalTestEmailHtml,
  finalTestEmailText,
} from '../../functions/_shared/email';

interface Env {
  DB: D1Database;
  RESEND_API_KEY: string;
  FROM_EMAIL: string;
  APP_URL: string;
}

interface ScheduleRow {
  id: string;
  email: string;
  url: string;
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runCron(env));
  },
};

async function runCron(env: Env): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  const studyRows = await env.DB.prepare(
    'SELECT id, email, url FROM schedules WHERE study_sent = 0 AND study_at <= ? AND completed_at IS NULL'
  ).bind(now).all<ScheduleRow>();

  let studySent = 0;
  for (const row of studyRows.results) {
    try {
      const articleDomain = new URL(row.url).hostname.replace(/^www\./, '');
      const studiedUrl = `${env.APP_URL}/studied?id=${row.id}`;

      await sendEmail({
        apiKey: env.RESEND_API_KEY,
        from: env.FROM_EMAIL,
        to: row.email,
        subject: `Time to study — ${articleDomain}`,
        html: studyReminderHtml(row.url, articleDomain, studiedUrl),
        text: studyReminderText(row.url, studiedUrl),
      });

      await env.DB.prepare('UPDATE schedules SET study_sent = 1 WHERE id = ?').bind(row.id).run();
      studySent++;
    } catch (err) {
      console.error(`Failed to send study reminder for schedule ${row.id}:`, err);
    }
  }

  const testRows = await env.DB.prepare(
    'SELECT id, email FROM schedules WHERE test_sent = 0 AND test_at <= ? AND studied_at IS NOT NULL AND completed_at IS NULL'
  ).bind(now).all<{ id: string; email: string }>();

  let testSent = 0;
  for (const row of testRows.results) {
    try {
      const finalUrl = `${env.APP_URL}/final?id=${row.id}`;

      await sendEmail({
        apiKey: env.RESEND_API_KEY,
        from: env.FROM_EMAIL,
        to: row.email,
        subject: 'Your final test is ready',
        html: finalTestEmailHtml(finalUrl),
        text: finalTestEmailText(finalUrl),
      });

      await env.DB.prepare('UPDATE schedules SET test_sent = 1 WHERE id = ?').bind(row.id).run();
      testSent++;
    } catch (err) {
      console.error(`Failed to send final test email for schedule ${row.id}:`, err);
    }
  }

  console.log(`Cron run complete. Study reminders sent: ${studySent}. Final tests sent: ${testSent}.`);
}

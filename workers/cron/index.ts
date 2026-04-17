import { runCron } from '../../functions/_shared/cron';
import type { Env } from '../../functions/_shared/types';

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runCron(env));
  },
};

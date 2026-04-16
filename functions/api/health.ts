import type { Env } from '../_shared/types';

export const onRequestGet: PagesFunction<Env> = async () => {
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

import handler, { createScheduledHandler, PluginBridge } from '@emdash-cms/cloudflare/worker';

export { PluginBridge };

const emdashFetch = handler.fetch;
if (!emdashFetch) {
  throw new Error('@emdash-cms/cloudflare/worker does not provide a fetch handler');
}

export default {
  ...handler,
  async fetch(request, env, ctx) {
    const response = await emdashFetch(request, env, ctx);
    const cleaned = new Response(response.body, response);
    cleaned.headers.delete('Server-Timing');
    return cleaned;
  },
  scheduled: createScheduledHandler(),
} satisfies ExportedHandler;

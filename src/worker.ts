import handler, {
  createScheduledHandler,
  PluginBridge,
} from '@emdash-cms/cloudflare/worker';

export { PluginBridge };

const isolateStartedAt = Date.now();
let requestCount = 0;

export default {
  ...handler,
  async fetch(request, env, ctx) {
    const start = performance.now();
    requestCount += 1;
    const response = await handler.fetch(request, env, ctx);
    const { pathname } = new URL(request.url);
    if (pathname.startsWith('/blog/')) {
      console.log(
        `[worker-timing] ${JSON.stringify({
          pathname,
          headersMs: Math.round(performance.now() - start),
          isolateAgeMs: Date.now() - isolateStartedAt,
          requestCount,
        })}`,
      );
    }
    return response;
  },
  scheduled: createScheduledHandler(),
} satisfies ExportedHandler<Env>;

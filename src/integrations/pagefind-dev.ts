import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';

const CONTENT_TYPES: Record<string, string> = {
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
};

export function pagefindDev(): AstroIntegration {
  let pagefindDir = '';
  return {
    name: 'pagefind-dev',
    hooks: {
      'astro:config:done': ({ config }) => {
        pagefindDir = join(fileURLToPath(config.outDir), 'pagefind');
      },
      'astro:server:setup': ({ server, logger }) => {
        if (!existsSync(pagefindDir)) {
          logger.warn(
            '検索の索引がありません。pnpm run build を一度実行すると、開発サーバーでも検索できます。',
          );
        }
        server.middlewares.use('/pagefind', (req, res, next) => {
          const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
          const file = normalize(join(pagefindDir, pathname));
          if (
            !file.startsWith(pagefindDir + sep) ||
            !existsSync(file) ||
            !statSync(file).isFile()
          ) {
            next();
            return;
          }
          res.setHeader('Content-Type', CONTENT_TYPES[extname(file)] ?? 'application/octet-stream');
          res.end(readFileSync(file));
        });
      },
    },
  };
}

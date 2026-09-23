import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';
import { EmDashClient } from 'emdash/client';
import { d1, PROJECT_ROOT, sqlString } from './lib';

const SITE_URL = 'https://suntory-n-water.com';

type Credential = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
};

function credentialPath(): string {
  const xdg = process.env.XDG_CONFIG_HOME;
  return join(xdg ? xdg : join(homedir(), '.config'), 'emdash', 'auth.json');
}

function createClient(): EmDashClient {
  const token = process.env.EMDASH_TOKEN;
  if (token) return new EmDashClient({ baseUrl: SITE_URL, token });
  const path = credentialPath();
  const store = existsSync(path)
    ? (JSON.parse(readFileSync(path, 'utf8')) as Record<string, Credential>)
    : {};
  const cred = store[SITE_URL];
  if (!cred?.accessToken)
    throw new Error(
      `${SITE_URL} の認証情報がありません。npx emdash login --url ${SITE_URL} を実行してください`,
    );
  if (new Date(cred.expiresAt) > new Date())
    return new EmDashClient({ baseUrl: SITE_URL, token: cred.accessToken });
  return new EmDashClient({
    baseUrl: SITE_URL,
    token: cred.accessToken,
    refreshToken: cred.refreshToken,
    onTokenRefresh: (accessToken, expiresIn) => {
      store[SITE_URL] = {
        ...cred,
        accessToken,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      };
      writeFileSync(path, JSON.stringify(store, null, '\t'), { mode: 0o600 });
    },
  });
}

async function main() {
  const args = process.argv.slice(2);
  const altIndex = args.indexOf('--alt');
  const alt = altIndex >= 0 ? args[altIndex + 1] : undefined;
  const filename = args.find((arg, i) => i !== altIndex && i !== altIndex + 1);
  if (
    !filename ||
    basename(filename) !== filename ||
    !filename.endsWith('.svg')
  )
    throw new Error(
      '使い方: bun upload-icon.ts <public/icons 内の SVG ファイル名> [--alt <代替テキスト>]',
    );

  const filePath = join(PROJECT_ROOT, 'public', 'icons', filename);
  if (!existsSync(filePath)) throw new Error(`${filePath} がありません`);

  const existing = d1(
    `SELECT id FROM media WHERE status='ready' AND filename=${sqlString(filename)} LIMIT 1`,
  );
  if (existing[0]) {
    console.log(
      JSON.stringify(
        { uploaded: false, id: existing[0].id, filename },
        null,
        2,
      ),
    );
    return;
  }

  const field = d1(
    "SELECT f.id FROM _emdash_fields f JOIN _emdash_collections c ON c.id = f.collection_id WHERE c.slug='posts' AND f.slug='featured_image'",
  );
  const fieldId = field[0]?.id;
  if (typeof fieldId !== 'string')
    throw new Error('posts の featured_image 項目が本番にありません');

  const form = new FormData();
  form.append(
    'file',
    new Blob([readFileSync(filePath)], { type: 'image/svg+xml' }),
    filename,
  );
  form.append('fieldId', fieldId);
  if (alt) form.append('alt', alt);

  const client = createClient();
  const response = await client.transport.fetch(
    new Request(`${SITE_URL}/_emdash/api/media`, {
      method: 'POST',
      body: form,
    }),
  );
  const body = (await response.json()) as {
    data?: { item?: { id: string; filename: string; mimeType: string } };
    error?: unknown;
  };
  if (!response.ok || !body.data?.item)
    throw new Error(
      `アップロードに失敗しました (${response.status}): ${JSON.stringify(body.error ?? body)}`,
    );
  const { id, mimeType } = body.data.item;
  console.log(
    JSON.stringify(
      { uploaded: true, id, filename: body.data.item.filename, mimeType },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

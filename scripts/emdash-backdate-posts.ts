import { readFile } from 'node:fs/promises';

type ReportArticle = { slug: string; publishedAt: string };
type MigrationReport = { articles: ReportArticle[] };
type ApiEnvelope = { data?: { token?: string }; token?: string };

const baseUrl = (process.env.EMDASH_URL ?? 'http://localhost:4321').replace(
  /\/$/u,
  '',
);
const reportPath =
  process.env.EMDASH_REPORT ?? 'reports/emdash/migration-report.json';

async function getDevToken(): Promise<string> {
  const response = await fetch(
    `${baseUrl}/_emdash/api/setup/dev-bypass?token=1`,
    {
      method: 'POST',
      headers: { Origin: baseUrl },
    },
  );
  if (!response.ok)
    throw new Error(
      `Dev setup failed: ${response.status} ${await response.text()}`,
    );
  const body = (await response.json()) as ApiEnvelope;
  const token = body.data?.token ?? body.token;
  if (!token) throw new Error('Dev setup did not return an API token');
  return token;
}

async function main(): Promise<void> {
  const report = JSON.parse(
    await readFile(reportPath, 'utf8'),
  ) as MigrationReport;
  const token =
    process.env.EMDASH_TOKEN ??
    (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')
      ? await getDevToken()
      : '');
  if (!token)
    throw new Error(
      'Set EMDASH_TOKEN when backdating a non-local EmDash environment',
    );
  const failed: string[] = [];
  for (const article of report.articles) {
    const response = await fetch(
      `${baseUrl}/_emdash/api/content/posts/${encodeURIComponent(article.slug)}/publish`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-EmDash-Request': '1',
          Origin: baseUrl,
        },
        body: JSON.stringify({
          publishedAt: article.publishedAt,
          overrideLock: true,
        }),
      },
    );
    if (!response.ok)
      failed.push(
        `${article.slug}: ${response.status} ${await response.text()}`,
      );
    else console.log(`backdated ${article.slug} -> ${article.publishedAt}`);
  }
  if (failed.length)
    throw new Error(
      `Backdating failed for ${failed.length} articles:\n${failed.join('\n')}`,
    );
  console.log(`Backdated ${report.articles.length} articles.`);
}

await main();

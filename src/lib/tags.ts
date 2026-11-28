const TAG_SLUG_OVERRIDES: Record<string, string> = {
  AgentsSkills: 'agents-skills',
  AppRouter: 'app-router',
  ChromeExtension: 'chrome-extension',
  ClaudeCode: 'claude-code',
  ClaudeMods: 'claude-mods',
  CloudflareWorkers: 'cloudflare-workers',
  GitHubActions: 'github-actions',
  GitHubAgenticWorkflows: 'github-agentic-workflows',
  GitHubCopilot: 'github-copilot',
  GoogleAppScript: 'google-app-script',
  GoogleCloud: 'google-cloud',
  GoogleMapsAPI: 'google-maps-api',
  InversifyJS: 'inversify-js',
  LineMessagingAPI: 'line-messaging-api',
  NotionAPI: 'notion-api',
  TailwindCSS: 'tailwind-css',
  VisualStudioCode: 'vscode',
  WebAPI: 'web-api',
  アニメ: 'anime',
  アルゴリズム: 'algorithm',
  オブジェクト指向プログラミング: 'object-oriented-programming',
  画像認識: 'image-recognition',
  クリーンアーキテクチャ: 'clean-architecture',
  形態素解析: 'morphological-analysis',
  個人開発: 'personal-development',
  スクレイピング: 'scraping',
  線形計画法: 'linear-programming',
  セキュリティ: 'security',
  SOLID原則: 'solid-principles',
  資格: 'certification',
  自然言語処理: 'natural-language-processing',
  自動化: 'automation',
  初心者: 'beginner',
  睡眠: 'sleep',
  データベース: 'database',
  テスト: 'test',
  読書: 'reading',
  ブログ: 'blog',
  ヘルスケア: 'healthcare',
  ポエム: 'poem',
  ポケモン: 'pokemon',
  ポートフォリオ: 'portfolio',
  絵文字: 'emoji',
  雑記: 'miscellaneous',
  旅行: 'travel',
};

const SLUG_FORMAT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export function tagSlug(name: string): string {
  const slug =
    TAG_SLUG_OVERRIDES[name] ??
    name
      .trim()
      .toLowerCase()
      .replace(/\./gu, '')
      .replace(/[\s/_]+/gu, '-')
      .replace(/-+/gu, '-')
      .replace(/^-|-$/gu, '');
  if (!SLUG_FORMAT.test(slug)) {
    throw new Error(
      `タグ「${name}」から小文字英数字とハイフンのスラッグを作れません。src/lib/tags.ts の TAG_SLUG_OVERRIDES に「${name}: 'hoge-fuga'」の形で追加してください。`,
    );
  }
  return slug;
}

export type Tag = { slug: string; label: string };

export function toTags(names: string[]): Tag[] {
  return names.map((label) => ({ slug: tagSlug(label), label }));
}

export function assertUniqueTagSlugs(names: Iterable<string>): void {
  const labelBySlug = new Map<string, string>();
  for (const name of names) {
    const slug = tagSlug(name);
    const other = labelBySlug.get(slug);
    if (other !== undefined && other !== name) {
      throw new Error(
        `タグ「${other}」と「${name}」が同じスラッグ「${slug}」になります。どちらかのタグ名に揃えてください。`,
      );
    }
    labelBySlug.set(slug, name);
  }
}

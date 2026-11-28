type PagefindResultData = {
  url: string;
  excerpt: string;
  meta: { title?: string };
};

type Pagefind = {
  init: () => Promise<void>;
  search: (query: string) => Promise<{ results: { data: () => Promise<PagefindResultData> }[] }>;
};

export type SearchHit = { url: string; title: string; excerpt: string };

let pagefindPromise: Promise<Pagefind> | undefined;

function loadPagefind(): Promise<Pagefind> {
  pagefindPromise ??= (async () => {
    const moduleUrl = new URL('/pagefind/pagefind.js', window.location.origin).href;
    const pagefind = (await import(moduleUrl)) as Pagefind;
    await pagefind.init();
    return pagefind;
  })();
  return pagefindPromise;
}

export async function searchPosts(query: string, limit: number): Promise<SearchHit[]> {
  const pagefind = await loadPagefind();
  const { results } = await pagefind.search(query);
  const data = await Promise.all(results.slice(0, limit).map((result) => result.data()));
  return data.map((item) => ({
    url: item.url.replace(/\.html$/u, ''),
    title: item.meta.title ?? item.url,
    excerpt: item.excerpt,
  }));
}

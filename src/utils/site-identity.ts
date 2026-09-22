/** Resolved media reference from getSiteSettings() */
export type MediaReference = {
  mediaId: string;
  alt?: string;
  url?: string;
};

export type BlogSiteIdentitySettings = {
  title?: string;
  tagline?: string;
  logo?: MediaReference;
  favicon?: MediaReference;
};

const DEFAULT_SITE_TITLE = 'My Blog';
const DEFAULT_SITE_TAGLINE = 'Thoughts, stories, and ideas.';

export function resolveBlogSiteIdentity(settings?: BlogSiteIdentitySettings) {
  return {
    siteTitle: settings?.title ?? DEFAULT_SITE_TITLE,
    siteTagline: settings?.tagline ?? DEFAULT_SITE_TAGLINE,
    siteLogo: settings?.logo?.url ? settings.logo : null,
  };
}

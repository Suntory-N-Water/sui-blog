export const SITE_TITLE = 'sui Blog';
export const SITE_TAGLINE = '日々の開発で得た知見や、実験的な実装、日常を記録するブログです。';
export const AUTHOR_NAME = 'sui';
export const AUTHOR_SAME_AS = ['https://github.com/Suntory-N-Water'];
export const GOOGLE_SITE_VERIFICATION = 'pd5OEQeX8d8I7AOZbR5U3SPIyZyXYxd392aatHH48yk';
export const GA_MEASUREMENT_ID = 'G-VJECTY2TM6';

export function siteOrigin(site: URL | undefined): string {
  if (!site) {
    throw new Error('astro.config.mjs の site を設定してください。');
  }
  return site.toString().replace(/\/+$/u, '');
}

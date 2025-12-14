import {
  REPOSITORY_CONSTANTS,
  SITE_CONSTANTS,
  SOCIAL_CONSTANTS,
} from '@/constants';
import type { SiteConfig } from '@/types/site-config';

export const siteConfig: SiteConfig = {
  name: SITE_CONSTANTS.NAME,
  description: SITE_CONSTANTS.DESCRIPTION,
  blogDescription: SITE_CONSTANTS.BLOG_DESCRIPTION,
  url: SITE_CONSTANTS.URL,
  ogImage: SITE_CONSTANTS.OG_IMAGE,
  links: {
    twitter: SOCIAL_CONSTANTS.TWITTER,
    github: SOCIAL_CONSTANTS.GITHUB,
  },
  repository: {
    branch: REPOSITORY_CONSTANTS.BRANCH,
  },
  copyRight: SITE_CONSTANTS.COPYRIGHT,
};

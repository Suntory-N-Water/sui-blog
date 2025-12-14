export type SiteConfig = {
  name: string;
  description: string;
  blogDescription: string;
  url: string;
  ogImage: string;
  links: {
    twitter: string;
    github: string;
  };
  repository?: {
    branch?: string;
  };
  copyRight: string;
};

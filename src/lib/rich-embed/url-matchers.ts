/**
 * YouTube URL の正規表現
 * - youtube.com/watch?v=ID
 * - youtu.be/ID
 * - youtube.com/embed/ID
 */
export const YOUTUBE_RE =
  /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;

/**
 * Twitter / X URL の正規表現
 * - twitter.com/user/status/ID
 * - x.com/user/status/ID
 */
export const TWITTER_RE =
  /^https?:\/\/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/;

/**
 * GitHub blob URL の正規表現
 * - github.com/owner/repo/blob/ref/path#L1-L20
 */
export const GITHUB_BLOB_RE =
  /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^#]+?)(?:#L(\d+)(?:-L(\d+))?)?$/;

/**
 * Speakerdeck URL の正規表現
 * - speakerdeck.com/user/slug
 */
export const SPEAKERDECK_RE = /^https?:\/\/speakerdeck\.com\/[^/]+\/[^/?#]+/;

export function isYouTubeUrl(url: string): boolean {
  return YOUTUBE_RE.test(url);
}

export function isTwitterUrl(url: string): boolean {
  return TWITTER_RE.test(url);
}

export function isGitHubBlobUrl(url: string): boolean {
  return GITHUB_BLOB_RE.test(url);
}

export function isSpeakerdeckUrl(url: string): boolean {
  return SPEAKERDECK_RE.test(url);
}

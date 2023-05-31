export const BSKY_POST_URL_RE = /\/profile\/([^\/]+)\/post\/([^\/]+)/;
export const BSKY_FEED_URL_RE = /\/profile\/([^\/]+)\/feed\/([^\/]+)/;

export const ATP_POST_URL_RE = /([^\/]+)\/app.bsky.feed.post\/([^\/]+)/;
export const ATP_FEED_URL_RE = /([^\/]+)\/app.bsky.feed.generator\/([^\/]+)/;

export const LINK_PROXY_ENDPOINT = 'https://cardyb.bsky.app/v1/extract';

export const isBskyUrl = (url: string) => {
	return url.startsWith('https://bsky.app/');
};

export const isBskyPostUrl = (url: string) => {
	return isBskyUrl(url) && BSKY_POST_URL_RE.test(url);
};

export const isBskyFeedUrl = (url: string) => {
	return isBskyUrl(url) && BSKY_FEED_URL_RE.test(url);
};

export const isAtpUri = (uri: string) => {
	return uri.startsWith('at://');
};

export const isAtpPostUri = (uri: string) => {
	return isAtpUri(uri) && ATP_POST_URL_RE.test(uri);
};

export const isAtpFeedUri = (uri: string) => {
	return isAtpUri(uri) && ATP_FEED_URL_RE.test(uri);
};

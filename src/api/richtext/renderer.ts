import {
	BSKY_FEED_URL_RE,
	BSKY_LIST_URL_RE,
	BSKY_POST_URL_RE,
	BSKY_PROFILE_URL_RE,
	isAppUrl,
} from '~/utils/link.ts';

import type { RichTextSegment } from './types.ts';

export const createRenderedRichText = (uid: string, segments: RichTextSegment[]) => {
	const div = document.createElement('div');

	for (let idx = 0, len = segments.length; idx < len; idx++) {
		const segment = segments[idx];
		const text = segment.text;

		const mention = segment.mention;
		const link = segment.link;
		const tag = segment.tag;

		if (mention) {
			const did = mention.did;
			const anchor = document.createElement('a');

			anchor.href = `/u/${uid}/profile/${did}`;
			anchor.className = 'text-accent hover:underline';
			anchor.textContent = text;
			anchor.toggleAttribute('link', true);

			div.appendChild(anchor);
		} else if (tag) {
			const hashtag = tag.tag;

			if (text !== '#' + hashtag) {
				continue;
			}

			const anchor = document.createElement('a');

			anchor.href = `/u/${uid}/explore/search?t=post&q=${encodeURIComponent(hashtag)}`;
			anchor.className = 'text-accent hover:underline';
			anchor.textContent = text;
			anchor.toggleAttribute('link', true);

			div.appendChild(anchor);
		} else if (link) {
			const uri = link.uri;
			const anchor = document.createElement('a');

			let match: RegExpExecArray | null | undefined;

			anchor.className = 'text-accent hover:underline';
			anchor.title = uri;

			if (isValidUrl(uri, text)) {
				anchor.textContent = text;
			} else {
				const fake = document.createElement('span');
				const real = document.createElement('span');

				fake.textContent = text;
				real.textContent = `(${toShortDomain(uri)})`;

				real.className = 'text-muted-fg ml-1';

				anchor.append(fake, real);
			}

			if (isAppUrl(uri)) {
				if ((match = BSKY_PROFILE_URL_RE.exec(uri))) {
					anchor.href = `/u/${uid}/profile/${match[1]}`;
				} else if ((match = BSKY_POST_URL_RE.exec(uri))) {
					anchor.href = `/u/${uid}/profile/${match[1]}/post/${match[2]}`;
				} else if ((match = BSKY_FEED_URL_RE.exec(uri))) {
					anchor.href = `/u/${uid}/profile/${match[1]}/feed/${match[2]}`;
				} else if ((match = BSKY_LIST_URL_RE.exec(uri))) {
					anchor.href = `/u/${uid}/profile/${match[1]}/lists/${match[2]}`;
				}
			}

			if (!match) {
				anchor.href = uri;
				anchor.rel = 'noopener noreferrer nofollow';
				anchor.target = '_blank';
			} else {
				anchor.toggleAttribute('link', true);
			}

			div.appendChild(anchor);
		} else {
			div.appendChild(document.createTextNode(text));
		}
	}

	return div;
};

const TRIM_HOST_RE = /^www\./;
const PATH_MAX_LENGTH = 18;

export const toShortUrl = (uri: string): string => {
	try {
		const url = new URL(uri);
		const protocol = url.protocol;

		const host = url.host.replace(TRIM_HOST_RE, '');
		const pathname = url.pathname;

		const path = (pathname === '/' ? '' : pathname) + url.search + url.hash;

		if (protocol === 'http:' || protocol === 'https:') {
			if (path.length > PATH_MAX_LENGTH) {
				return host + path.slice(0, PATH_MAX_LENGTH - 1) + '…';
			}

			return host + path;
		}
	} catch {}

	return uri;
};

export const toShortDomain = (uri: string): string => {
	try {
		const url = new URL(uri);

		const protocol = url.protocol;
		const host = url.host.replace(TRIM_HOST_RE, '');

		if (protocol === 'http:' || protocol === 'https:') {
			return host;
		}
	} catch {}

	return uri;
};

// Regular expression for matching domains on text, this also takes care of bots
// that would wrap the URL domain with square brackets.
const MATCH_DOMAIN_RE =
	/(?:^|\[(?=.*\]))(?:https?:\/\/)?((?:[a-z][a-z0-9]*(?:\.[a-z0-9]+)*|\d+(?:\.\d+){3})(?:\:\d+)?)(?:$|\/|\?|(?<=\[.*)\])/;

export const isValidUrl = (uri: string, text: string) => {
	const match = MATCH_DOMAIN_RE.exec(text);

	if (match) {
		try {
			const url = new URL(uri);
			const domain = url.host.replace(TRIM_HOST_RE, '');

			const matched = match[1].replace(TRIM_HOST_RE, '');

			return domain === matched;
		} catch {}
	}

	return false;
};

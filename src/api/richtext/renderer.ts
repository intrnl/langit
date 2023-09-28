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
			const validity = checkLinkValidity(uri, text);

			const anchor = document.createElement('a');

			let match: RegExpExecArray | null | undefined;

			anchor.title = uri;

			if (validity) {
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

				if (validity === true) {
					anchor.className = 'text-accent hover:underline';
					anchor.textContent = text;
				} else {
					const fake = document.createElement('span');
					const real = document.createElement('span');

					anchor.className = 'group';

					fake.textContent = text;
					fake.className = 'text-accent group-hover:underline';

					real.textContent = `(${validity})`;
					real.className = 'text-muted-fg ml-1';

					anchor.append(fake, real);
				}
			} else {
				anchor.className = 'text-muted';
				anchor.textContent = `${text} (invalid URL)`;
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

// Regular expression for matching domains on text, this also takes care of bots
// that would wrap the URL domain with square brackets.
const MATCH_DOMAIN_RE =
	/(?:^|\[(?=.*\]))(?:https?:\/\/)?((?:[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*|\d+(?:\.\d+){3})(?:\:\d+)?)(?:$|[\/?#]|(?<=\[.*)\])/;

export const checkLinkValidity = (uri: string, text: string) => {
	let url: URL;
	try {
		url = new URL(uri);
	} catch {
		return null;
	}

	const match = MATCH_DOMAIN_RE.exec(text);

	const protocol = url.protocol;
	const host = url.host;

	if (match) {
		const domain = host.replace(TRIM_HOST_RE, '');
		const matched = match[1].replace(TRIM_HOST_RE, '');

		if (domain === matched) {
			return true;
		}
	}

	if (protocol === 'https:' || protocol === 'http:') {
		return host;
	}

	return uri;
};

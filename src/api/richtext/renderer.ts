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
	/(?:^|\[(?=.*\]))(?:([a-z]+:)\/\/)?(.+@)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\:\d+)?)(?:$|[\/?#]|(?<=\[.*)\])/;

/**
 * Checks if the link at least contains the same host as what's being described
 * on text, if no protocol is defined on the text itself then it is assumed to
 * be http:
 *
 * Returns `null` if parsing the actual URL fails, `true` if it is valid, or a
 * string containing what should be shown as the "real" host, so long as it is
 * in fact, an http: URL, otherwise it just returns the passed URL.
 */
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

	// Not sure if we need to check for username:password@ within the URL,
	// we still need to match for them in the regex, but we can just skip the
	// validation for now.

	//const auth = buildAuthPart(url);

	const isHttp = protocol === 'https:' || protocol === 'http:';

	jump: if (match) {
		const actualProtocol = match[1];

		if (actualProtocol ? actualProtocol !== protocol : !isHttp) {
			break jump;
		}

		//const actualAuth = match[2];

		//if (actualAuth ? auth !== actualAuth : auth) {
		//	break jump;
		//}

		const actualHost = match[3].replace(TRIM_HOST_RE, '').toLowerCase();
		const expectedHost = host.replace(TRIM_HOST_RE, '').toLowerCase();

		if (actualHost !== expectedHost) {
			break jump;
		}

		return true;
	}

	if (isHttp) {
		//return auth + host;
		return host;
	}

	return uri;
};

// const buildAuthPart = (url: URL) => {
// 	const user = url.username;
// 	const password = url.password;

// 	return user && password ? `${user}:${password}@` : user ? `${user}@` : '';
// };

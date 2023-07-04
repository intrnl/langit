import { BSKY_FEED_URL_RE, BSKY_POST_URL_RE, BSKY_PROFILE_URL_RE, isAppUrl } from '~/utils/link.ts';

import { type RichTextSegment } from './types.ts';

export const createRenderedRichText = (uid: string, segments: RichTextSegment[]) => {
	const div = document.createElement('div');

	for (let idx = 0, len = segments.length; idx < len; idx++) {
		const segment = segments[idx];

		const mention = segment.mention;
		const link = segment.link;

		let match: RegExpExecArray | null | undefined;

		if (mention) {
			const did = mention.did;
			const anchor = document.createElement('a');

			anchor.href = `/u/${uid}/profile/${did}`;
			anchor.className = 'text-accent hover:underline';
			anchor.textContent = segment.text;
			anchor.toggleAttribute('link', true);

			div.appendChild(anchor);
		} else if (link) {
			const uri = link.uri;
			const anchor = document.createElement('a');

			anchor.className = 'text-accent hover:underline';
			anchor.textContent = toShortUrl(segment.text);

			if (isAppUrl(uri)) {
				if ((match = BSKY_PROFILE_URL_RE.exec(uri))) {
					anchor.href = `/u/${uid}/profile/${match[1]}`;
					anchor.toggleAttribute('link', true);
				} else if ((match = BSKY_POST_URL_RE.exec(uri))) {
					anchor.href = `/u/${uid}/profile/${match[1]}/post/${match[2]}`;
					anchor.toggleAttribute('link', true);
				} else if ((match = BSKY_FEED_URL_RE.exec(uri))) {
					anchor.href = `/u/${uid}/profile/${match[1]}/feed/${match[2]}`;
					anchor.toggleAttribute('link', true);
				} else {
					anchor.href = uri;
					anchor.rel = 'noopener noreferrer nofollow';
					anchor.target = '_blank';
				}
			} else {
				anchor.href = uri;
				anchor.rel = 'noopener noreferrer nofollow';
				anchor.target = '_blank';
			}

			div.appendChild(anchor);
		} else {
			div.appendChild(document.createTextNode(segment.text));
		}
	}

	return div;
};

const U_RE = /^\/u\/[^\/]+/;

export const alterRenderedRichTextUid = (template: HTMLElement, uid: string) => {
	const links = template.querySelectorAll<HTMLAnchorElement>('a[link]');

	for (let idx = 0, len = links.length; idx < len; idx++) {
		const node = links[idx];
		const href = node.getAttribute('href')!;

		node.href = href.replace(U_RE, `/u/${uid}`);
	}
};

const TRIM_HOST_RE = /^www\./;

export const toShortUrl = (uri: string): string => {
	try {
		const url = new URL(uri);

		const host = url.host.replace(TRIM_HOST_RE, '');
		const short = host + (url.pathname === '/' ? '' : url.pathname) + url.search + url.hash;

		if (short.length > 30) {
			return short.slice(0, 27) + '...';
		}

		return short;
	} catch (e) {
		return uri;
	}
};

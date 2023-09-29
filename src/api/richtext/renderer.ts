import { openModal } from '~/globals/modals.tsx';
import {
	BSKY_FEED_URL_RE,
	BSKY_LIST_URL_RE,
	BSKY_POST_URL_RE,
	BSKY_PROFILE_URL_RE,
	isAppUrl,
} from '~/utils/link.ts';

import LinkWarningDialog from '~/components/dialogs/LinkWarningDialog.tsx';

import type { RichTextSegment } from './types.ts';

type IgnoredLinkNode = HTMLAnchorElement & { _ignored?: boolean };

export const handleInvalidLinkClick = (ev: Event) => {
	const target = ev.target as Element;
	const anchor = target.closest<IgnoredLinkNode>('a[data-invalid=true]');

	if (!anchor || anchor._ignored) {
		return;
	}

	ev.preventDefault();

	openModal(() => {
		return LinkWarningDialog({
			uri: anchor.href,
			onConfirm: () => {
				try {
					anchor._ignored = true;
					anchor.click();
				} finally {
					anchor._ignored = false;
				}
			},
		});
	});
};

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
			const valid = isLinkValid(uri, text);

			const anchor = document.createElement('a');

			let match: RegExpExecArray | null | undefined;
			let href = uri;

			anchor.className = 'text-accent hover:underline';

			anchor.title = uri;
			anchor.textContent = text;

			if (!valid) {
				anchor.dataset.invalid = '' + true;
			}

			if (isAppUrl(uri)) {
				if ((match = BSKY_PROFILE_URL_RE.exec(uri))) {
					href = `/u/${uid}/profile/${match[1]}`;
				} else if ((match = BSKY_POST_URL_RE.exec(uri))) {
					href = `/u/${uid}/profile/${match[1]}/post/${match[2]}`;
				} else if ((match = BSKY_FEED_URL_RE.exec(uri))) {
					href = `/u/${uid}/profile/${match[1]}/feed/${match[2]}`;
				} else if ((match = BSKY_LIST_URL_RE.exec(uri))) {
					href = `/u/${uid}/profile/${match[1]}/lists/${match[2]}`;
				}
			}

			anchor.href = href;

			if (!match) {
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
const TRIM_URLTEXT_RE = /^\s*(https?:\/\/)?(?:www\.)?/;
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

const buildHostPart = (url: URL) => {
	const username = url.username;
	// const password = url.password;

	const hostname = url.hostname.replace(TRIM_HOST_RE, '').toLowerCase();
	const port = url.port;

	// const auth = username ? username + (password ? ':' + password : '') + '@' : '';

	// Perhaps might be best if we always warn on authentication being passed.
	const auth = username ? '\0@@\0' : '';
	const host = hostname + (port ? ':' + port : '');

	return auth + host;
};

export const isLinkValid = (uri: string, text: string) => {
	let url: URL;
	let protocol: string;
	try {
		url = new URL(uri);
		protocol = url.protocol;

		if (protocol !== 'https:' && protocol !== 'http:') {
			return false;
		}
	} catch {
		return false;
	}

	const expectedHost = buildHostPart(url);
	const length = expectedHost.length;

	const normalized = text.replace(TRIM_URLTEXT_RE, '').toLowerCase();
	const normalizedLength = normalized.length;

	const boundary = normalizedLength >= length ? normalized[length] : undefined;

	return (
		(!boundary || boundary === '/' || boundary === '?' || boundary === '#') &&
		normalized.startsWith(expectedHost)
	);
};

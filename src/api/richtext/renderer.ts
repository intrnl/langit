import { type RichTextSegment } from './types.ts';

export const createRenderedRichText = (uid: string, segments: RichTextSegment[]) => {
	const div = document.createElement('div');

	for (let idx = 0, len = segments.length; idx < len; idx++) {
		const segment = segments[idx];

		const mention = segment.mention;
		const link = segment.link;

		if (mention) {
			const did = mention.did;
			const anchor = document.createElement('a');

			anchor.href = `/u/${uid}/profile/${did}`;
			anchor.className = 'text-accent hover:underline';
			anchor.textContent = segment.text;
			anchor.toggleAttribute('link', true);
			anchor.setAttribute('data-mention', did);

			div.appendChild(anchor);
		}
		else if (link) {
			const uri = link.uri;
			const anchor = document.createElement('a');

			anchor.rel = 'noopener noreferrer nofollow';
			anchor.target = '_blank';
			anchor.href = uri;
			anchor.className = 'text-accent hover:underline';
			anchor.textContent = toShortUrl(uri);

			div.appendChild(anchor);
		}
		else {
			div.appendChild(document.createTextNode(segment.text));
		}
	}

	return div;
};

export const alterRenderedRichTextUid = (template: HTMLElement, uid: string) => {
	const mentions = template.querySelectorAll<HTMLAnchorElement>('a[data-mention]');

	for (let idx = 0, len = mentions.length; idx < len; idx++) {
		const node = mentions[idx];
		const did = node.getAttribute('data-mention')!;

		node.href = `/u/${uid}/profile/${did}`;
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
	}
	catch (e) {
		return uri;
	}
};

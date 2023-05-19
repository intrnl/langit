import { type Facet } from './types';
import { UnicodeString, utf16IndexToUtf8Index } from './unicode';

export const MENTION_RE = /(^|\s|\()(@)([a-zA-Z0-9.-]+)(\b)/g;
export const LINK_RE = /(^|\s|\()((https?:\/\/[\S]+)|(([a-z][a-z0-9]*(\.[a-z0-9]+)+)[\S]*))/gim;

export const INVALID_TLD_RE = /\.(?:example|internal|invalid|local|localhost|test)$/i;

export const detectFacets = (text: UnicodeString): Facet[] | undefined => {
	const facets: Facet[] = [];
	let match: RegExpExecArray | null;

	while (match = MENTION_RE.exec(text.utf16)) {
		if (INVALID_TLD_RE.test(match[3])) {
			continue;
		}

		const start = text.utf16.indexOf(match[3], match.index) - 1;

		facets.push({
			$type: 'app.bsky.richtext.facet',
			index: {
				byteStart: utf16IndexToUtf8Index(text, start),
				byteEnd: utf16IndexToUtf8Index(text, start + match[3].length + 1),
			},
			features: [
				{
					$type: 'io.github.intrnl.langit#unresolvedMention',
					handle: match[3],
				},
			],
		});
	}

	while (match = LINK_RE.exec(text.utf16)) {
		let uri = match[2];

		if (!uri.startsWith('http')) {
			const domain = match[5];

			if (!domain || INVALID_TLD_RE.test(domain)) {
				continue;
			}

			uri = `https://${uri}`;
		}

		let start = text.utf16.indexOf(match[2], match.index);
		let end = start + match[2].length;

		// strip ending punctuation
		if (/[.,;!?]$/.test(uri)) {
			uri = uri.slice(0, -1);
			end--;
		}

		if (/[)]$/.test(uri) && !uri.includes('(')) {
			uri = uri.slice(0, -1);
			end--;
		}

		facets.push({
			$type: 'app.bsky.richtext.facet',
			index: {
				byteStart: utf16IndexToUtf8Index(text, start),
				byteEnd: utf16IndexToUtf8Index(text, end),
			},
			features: [
				{
					$type: 'app.bsky.richtext.facet#link',
					uri: uri,
				},
			],
		});
	}

	return facets.length > 0 ? facets : undefined;
};

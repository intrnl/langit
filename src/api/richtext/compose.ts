import type { DID } from '@intrnl/bluesky-client/atp-schema';

import { multiagent } from '~/globals/agent.ts';

import { graphemeLen } from './intl.ts';
import { toShortUrl } from './renderer.ts';

import type { Facet, PreliminaryFacet } from './types.ts';
import { XRPCError } from '@intrnl/bluesky-client/xrpc-utils';

const WHITESPACE_RE = /\s+$| +(?=\n|$)/g;

const ABS_LINK_RE = /https?:\/\/[\S]+/;
const TRAILING_RE = /\)?[.,;]*$/;

const MENTION_RE = /(?<=^|\s)@([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\.[a-zA-Z]+))\b/g;
const HASHTAG_RE = /(?<=^|\s)#([^\s]+)/g;

const isAscii = (str: string) => {
	for (let idx = 0, len = str.length; idx < len; idx++) {
		const char = str.charCodeAt(idx);

		if (char > 127) {
			return false;
		}
	}

	return true;
};

const facetSort = (a: PreliminaryFacet, b: PreliminaryFacet) => {
	return a.start - b.start;
};

export const textToPrelimRt = (text: string) => {
	const facets: PreliminaryFacet[] = [];
	const links: string[] = [];

	let match: RegExpMatchArray | null;

	text = text.replace(WHITESPACE_RE, '');

	text = text.replace(ABS_LINK_RE, (match, index: number) => {
		const uri = match.replace(TRAILING_RE, '');
		const label = toShortUrl(uri);

		facets.push({
			start: index,
			end: index + label.length,
			feature: {
				$type: 'app.bsky.richtext.facet#link',
				uri: uri,
			},
		});

		links.push(uri);

		return label;
	});

	// while ((match = ABS_LINK_RE.exec(text))) {
	// 	const index = match.index!;
	// 	const uri = match[0].replace(TRAILING_RE, '');
	// 	facets.push({
	// 		start: index,
	// 		end: index + uri.length,
	// 		feature: {
	// 			$type: 'app.bsky.richtext.facet#link',
	// 			uri: uri,
	// 		},
	// 	});
	// 	links.push(uri);
	// }

	while ((match = MENTION_RE.exec(text))) {
		const index = match.index!;
		const handle = match[1];

		facets.push({
			start: index,
			end: index + match[0].length,
			feature: {
				$type: 'io.github.intrnl.langit#unresolvedMention',
				handle: handle,
			},
		});
	}

	while ((match = HASHTAG_RE.exec(text))) {
		const index = match.index!;
		const tag = match[1];

		facets.push({
			start: index,
			end: index + match[0].length,
			feature: {
				$type: 'app.bsky.richtext.facet#tag',
				tag: tag,
			},
		});
	}

	return {
		length: isAscii(text) ? text.length : graphemeLen(text),
		text: text,
		facets: facets.sort(facetSort),
		links: links,
	};
};

export const finalizePrelimFacets = async (
	uid: DID,
	prelim: ReturnType<typeof textToPrelimRt>,
): Promise<Facet[]> => {
	const agent = await multiagent.connect(uid);

	const { text, facets: prelimFacets } = prelim;
	const facets: Facet[] = [];

	let textCursor = 0;
	let facetCursor = 0;

	let utf8Length = 0;

	if (prelimFacets.length < 1) {
		return facets;
	}

	do {
		let { feature, start, end } = prelimFacets[facetCursor];

		if (textCursor < start) {
			const sliced = text.slice(textCursor, start);
			utf8Length += getUtf8Length(sliced);
		} else if (textCursor > start) {
			facetCursor++;
			continue;
		}

		textCursor = end;
		facetCursor++;

		if (start < end) {
			const sliced = text.slice(start, end);
			const length = getUtf8Length(sliced);

			const index = {
				byteStart: utf8Length,
				byteEnd: (utf8Length += length),
			};

			if (feature.$type === 'io.github.intrnl.langit#unresolvedMention') {
				try {
					const response = await agent.rpc.get('com.atproto.identity.resolveHandle', {
						params: {
							handle: feature.handle,
						},
					});

					const did = response.data.did;

					facets.push({
						index: index,
						features: [
							{
								$type: 'app.bsky.richtext.facet#mention',
								did: did,
							},
						],
					});
				} catch (err) {
					if (err instanceof XRPCError && err.error === 'InvalidRequest') {
						continue;
					}

					throw err;
				}
			} else {
				facets.push({
					index: index,
					features: [feature],
				});
			}
		}
	} while (facetCursor < prelimFacets.length);

	return facets;
};

const encoder = new TextEncoder();

const getUtf8Length = (str: string): number => {
	return isAscii(str) ? str.length : encoder.encode(str).byteLength;
};

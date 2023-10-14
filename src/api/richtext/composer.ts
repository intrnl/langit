import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { XRPCError } from '@intrnl/bluesky-client/xrpc-utils';

import { multiagent } from '~/globals/agent.ts';

import { graphemeLen } from './intl.ts';
import { toShortUrl } from './renderer.ts';

import type { Facet, LinkFeature, MentionFeature, TagFeature, UnresolvedMentionFeature } from './types.ts';

const enum RichText {
	LINK,
	MENTION,
	TAG,
}

const WHITESPACE_RE = /\s+$| +(?=\n|$)/g;

const ABS_LINK_RE = /https?:\/\/[\S]+/g;
const TRAILING_RE = /\)?[.,;]*$/;

const MENTION_RE = /(?<=^|\s)(\\)?@([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\.[a-zA-Z]+))\b/g;
const HASHTAG_RE = /(?<=^|\s)(\\)?#([^\s]+)/g;

const isAscii = (str: string) => {
	for (let idx = 0, len = str.length; idx < len; idx++) {
		const char = str.charCodeAt(idx);

		if (char > 127) {
			return false;
		}
	}

	return true;
};

interface PreliminaryMatch {
	t: RichText;
	m: RegExpMatchArray;
}

interface PreliminarySegment {
	text: string;
	feature?: LinkFeature | TagFeature | MentionFeature | UnresolvedMentionFeature;
}

const matchSort = (a: PreliminaryMatch, b: PreliminaryMatch) => {
	return a.m.index! - b.m.index!;
};

export const textToPrelimRt = (text: string) => {
	const links: string[] = [];
	const segments: PreliminarySegment[] = [];

	const matches: PreliminaryMatch[] = [];
	let match: RegExpMatchArray | null;

	let finalText = '';

	text = text.replace(WHITESPACE_RE, '');

	while ((match = ABS_LINK_RE.exec(text))) {
		matches.push({ t: RichText.LINK, m: match });
	}
	while ((match = MENTION_RE.exec(text))) {
		matches.push({ t: RichText.MENTION, m: match });
	}
	while ((match = HASHTAG_RE.exec(text))) {
		matches.push({ t: RichText.TAG, m: match });
	}

	const matchesLen = matches.length;

	if (matchesLen > 0) {
		let textCursor = 0;
		let matchCursor = 0;

		matches.sort(matchSort);

		do {
			const { t: type, m: match } = matches[matchCursor];

			const matched = match[0];

			const start = match.index!;
			const end = start + matched.length;

			if (textCursor < start) {
				const sliced = text.slice(textCursor, start);

				segments.push({ text: sliced, feature: undefined });
				finalText += sliced;
			} else if (textCursor > start) {
				matchCursor++;
				continue;
			}

			let segment: PreliminarySegment | undefined;

			textCursor = end;
			matchCursor++;

			if (type === RichText.LINK) {
				const uri = matched.replace(TRAILING_RE, '');
				const label = toShortUrl(uri);

				links.push(uri);

				segment = {
					text: label,
					feature: {
						$type: 'app.bsky.richtext.facet#link',
						uri: uri,
					},
				};
			} else if (type === RichText.MENTION) {
				if (match[1]) {
					const sliced = matched.slice(1);
					segment = { text: sliced };
				} else {
					const handle = match[2];

					segment = {
						text: matched,
						feature: {
							$type: 'io.github.intrnl.langit#unresolvedMention',
							handle: handle,
						},
					};
				}
			} else if (type === RichText.TAG) {
				if (match[1]) {
					const sliced = matched.slice(1);
					segment = { text: sliced };
				} else {
					const tag = match[2];

					segment = {
						text: matched,
						feature: {
							$type: 'app.bsky.richtext.facet#tag',
							tag: tag,
						},
					};
				}
			}

			if (segment) {
				finalText += segment.text;
				segments.push(segment);
			}
		} while (matchCursor < matchesLen);

		if (textCursor < text.length) {
			const sliced = text.slice(textCursor);

			finalText += sliced;
			segments.push({ text: sliced });
		}
	} else {
		finalText = text;
		segments.push({ text: text });
	}

	return {
		text: finalText,
		segments,
		links,
	};
};

export const getRtLength = (rt: ReturnType<typeof textToPrelimRt>) => {
	const text = rt.text;
	return isAscii(text) ? text.length : graphemeLen(text);
};

const encoder = new TextEncoder();

const getUtf8Length = (str: string): number => {
	return isAscii(str) ? str.length : encoder.encode(str).byteLength;
};

export const finalizeRtFacets = async (uid: DID, rt: ReturnType<typeof textToPrelimRt>) => {
	const agent = await multiagent.connect(uid);

	const segments = rt.segments;
	const facets: Facet[] = [];

	let utf8Length = 0;

	for (let idx = 0, len = segments.length; idx < len; idx++) {
		const { text, feature } = segments[idx];

		const start = utf8Length;
		const end = (utf8Length += getUtf8Length(text));

		if (feature) {
			const index = {
				byteStart: start,
				byteEnd: end,
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
	}

	return facets;
};

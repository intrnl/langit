import { UnicodeString } from './unicode.ts';
import type { Facet, LinkFeature, MentionFeature, RichTextSegment, TagFeature } from './types.ts';

export interface RichTextOptions {
	text: string;
	facets?: Facet[];
	cleanNewLines?: boolean;
}

const createSegment = (text: string, facet?: Facet): RichTextSegment => {
	let link: LinkFeature | undefined;
	let mention: MentionFeature | undefined;
	let tag: TagFeature | undefined;

	if (facet) {
		const features = facet.features;

		for (let idx = 0, len = features.length; idx < len; idx++) {
			const feature = features[idx];
			const $type = feature.$type;

			if ($type === 'app.bsky.richtext.facet#link') {
				link = feature;
			} else if ($type === 'app.bsky.richtext.facet#mention') {
				mention = feature;
			} else if ($type === 'app.bsky.richtext.facet#tag') {
				tag = feature;
			}
		}
	}

	return { text, link, mention, tag };
};

export const facetSort = (a: Facet, b: Facet) => a.index.byteStart - b.index.byteStart;

export const segmentRichText = (opts: RichTextOptions) => {
	const text = new UnicodeString(opts.text);
	const facets = opts.facets;

	if (!facets || facets.length < 1) {
		return [createSegment(text.utf16)];
	}

	const segments: RichTextSegment[] = [];
	let textCursor = 0;
	let facetCursor = 0;

	do {
		const facet = facets[facetCursor];
		const index = facet.index;

		if (textCursor < index.byteStart) {
			segments.push(createSegment(text.slice(textCursor, index.byteStart)));
		} else if (textCursor > index.byteStart) {
			facetCursor++;
			continue;
		}

		if (index.byteStart < index.byteEnd) {
			const subtext = text.slice(index.byteStart, index.byteEnd);

			if (!subtext.trim()) {
				// dont empty string entities
				segments.push(createSegment(subtext));
			} else {
				segments.push(createSegment(subtext, facet));
			}
		}

		textCursor = index.byteEnd;
		facetCursor++;
	} while (facetCursor < facets.length);

	if (textCursor < text.length) {
		segments.push(createSegment(text.slice(textCursor, text.length)));
	}

	return segments;
};

import { UnicodeString } from './unicode.ts';

export interface ByteSlice {
	byteStart: number;
	byteEnd: number;
}

export interface FacetMention {
	$type: 'app.bsky.richtext.facet#mention';
	did: string;
}
export interface FacetLink {
	$type: 'app.bsky.richtext.facet#link';
	uri: string;
}

export interface Facet {
	index: ByteSlice;
	features: Array<FacetMention | FacetLink>;
}

export interface RichTextOptions {
	text: string;
	facets?: Facet[];
	cleanNewLines?: boolean;
}

export class RichTextSegment {
	public link?: FacetLink;
	public mention?: FacetMention;

	constructor (public text: string, facet?: Facet) {
		if (facet) {
			const features = facet.features;

			for (let idx = 0, len = features.length; idx < len; idx++) {
				const feature = features[idx];

				if (feature.$type === 'app.bsky.richtext.facet#link') {
					this.link = feature;
				}
				else if (feature.$type === 'app.bsky.richtext.facet#mention') {
					this.mention = feature;
				}
			}
		}
	}
}

export const facetSort = (a: Facet, b: Facet) => a.index.byteStart - b.index.byteStart;

export class RichText {
	text: UnicodeString;
	facets?: Facet[];

	constructor (props: RichTextOptions) {
		this.text = new UnicodeString(props.text);
		this.facets = props.facets;
	}

	*segments (): Generator<RichTextSegment, void, void> {
		const text = this.text;
		const facets = this.facets;

		if (!facets || facets.length < 1) {
			yield new RichTextSegment(text.utf16);
			return;
		}

		let textCursor = 0;
		let facetCursor = 0;

		do {
			const facet = facets[facetCursor];
			const index = facet.index;

			if (textCursor < index.byteStart) {
				yield new RichTextSegment(text.slice(textCursor, index.byteStart));
			}
			else if (textCursor > index.byteStart) {
				facetCursor++;
				continue;
			}

			if (index.byteStart < index.byteEnd) {
				const subtext = text.slice(index.byteStart, index.byteEnd);

				if (!subtext.trim()) {
					// dont empty string entities
					yield new RichTextSegment(subtext);
				}
				else {
					yield new RichTextSegment(subtext, facet);
				}
			}

			textCursor = index.byteEnd;
			facetCursor++;
		}
		while (facetCursor < facets.length);

		if (textCursor < text.length) {
			yield new RichTextSegment(text.slice(textCursor, text.length));
		}
	}
}

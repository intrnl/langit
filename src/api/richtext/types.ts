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

export interface RichTextSegment {
	text: string;
	link?: FacetLink;
	mention?: FacetMention;
}

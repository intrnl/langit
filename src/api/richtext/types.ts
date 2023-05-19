export interface ByteSlice {
	byteStart: number;
	byteEnd: number;
}

/** This is a non-standard facet so that we don't mix up FacetMention for unresolved handles */
export interface FacetUnresolvedMention {
	$type: 'io.github.intrnl.langit#unresolvedMention';
	handle: string;
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
	$type: 'app.bsky.richtext.facet';
	index: ByteSlice;
	features: Array<FacetUnresolvedMention | FacetMention | FacetLink>;
}

export interface RichTextSegment {
	text: string;
	link?: FacetLink;
	mention?: FacetMention;
}

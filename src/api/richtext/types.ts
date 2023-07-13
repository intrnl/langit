import type { RefOf, UnionOf } from '@intrnl/bluesky-client/atp-schema';

export type Facet = RefOf<'app.bsky.richtext.facet'>;
export type LinkFacet = UnionOf<'app.bsky.richtext.facet#link'>;
export type MentionFacet = UnionOf<'app.bsky.richtext.facet#mention'>;

/** This is a non-standard facet so that we don't mix up MentionFacet for unresolved handles */
export interface UnresolvedMentionFacet {
	$type: 'io.github.intrnl.langit#unresolvedMention';
	handle: string;
}

export interface RichTextSegment {
	text: string;
	link?: LinkFacet;
	mention?: MentionFacet;
}

import type { RefOf } from '@externdefs/bluesky-client/atp-schema';

export const MAX_DISPLAYNAME_LENGTH = 64;
export const MAX_BIO_LENGTH = 256;

type ListPurpose = RefOf<'app.bsky.graph.defs#listPurpose'>;

export const ListPurposeLabels: Record<ListPurpose, string> = {
	'app.bsky.graph.defs#modlist': 'Moderation list',
	'app.bsky.graph.defs#curatelist': 'Curation list',
};

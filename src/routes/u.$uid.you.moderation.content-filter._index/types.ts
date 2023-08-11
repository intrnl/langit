import type { DID } from '@intrnl/bluesky-client/atp-schema';

export interface Labeler {
	did: DID;
	name: string;
	handle: string;
}

export const LABELERS: Labeler[] = [
	{
		did: 'did:plc:ar7c4by46qjdydhdevvrndac',
		name: 'bsky.social Moderation Team',
		handle: 'moderation.bsky.social',
	},
];


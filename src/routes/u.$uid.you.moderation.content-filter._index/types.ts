import type { DID } from '@externdefs/bluesky-client/atp-schema';

import { DEFAULT_MODERATION_LABELER } from '~/api/defaults.ts';

export interface Labeler {
	did: DID;
	name: string;
	handle: string;
}

export const LABELERS: Labeler[] = [
	{
		did: DEFAULT_MODERATION_LABELER,
		name: 'bsky.social Moderation Team',
		handle: 'moderation.bsky.social',
	},
];

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import type { QueryFn } from '@intrnl/sq';

import { multiagent } from '~/globals/agent.ts';

import { mergeSignalizedProfile } from '../cache/profiles.ts';
import type { ProfilesListPage } from '../models/profiles-list.ts';

import { type Collection, pushCollection } from '../utils.ts';

export const getSelfBlocksKey = (uid: DID, limit: number) => ['getSelfBlocks', uid, limit] as const;
export const getSelfBlocks: QueryFn<
	Collection<ProfilesListPage>,
	ReturnType<typeof getSelfBlocksKey>,
	string
> = async (key, { data: collection, param }) => {
	const [, uid, limit] = key;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.graph.getBlocks', {
		params: { limit, cursor: param },
	});

	const data = response.data;
	const blocks = data.blocks;

	const page: ProfilesListPage = {
		cursor: blocks.length >= limit ? data.cursor : undefined,
		profiles: blocks.map((profile) => mergeSignalizedProfile(uid, profile)),
	};

	return pushCollection(collection, page, param);
};

export const getSelfBlocksLatestKey = (uid: DID) => ['getSelfBlocksLatest', uid] as const;
export const getSelfBlocksLatest: QueryFn<
	{ did: DID | undefined },
	ReturnType<typeof getSelfBlocksLatestKey>
> = async (key) => {
	const [, uid] = key;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.graph.getBlocks', {
		params: {
			limit: 1,
		},
	});

	const data = response.data;
	const blocks = data.blocks;

	return { did: blocks.length > 0 ? blocks[0].did : undefined };
};

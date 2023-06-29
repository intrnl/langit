import { type QueryFn } from '~/lib/solid-query/index.ts';

import { multiagent } from '~/globals/agent.ts';

import { mergeSignalizedProfile } from '../cache/profiles.ts';
import { type ProfilesListPage } from '../models/profiles-list.ts';

import { type BskyProfileFollow } from '../types.ts';
import { type Collection, type DID, pushCollection } from '../utils.ts';

export const getSelfBlocksKey = (uid: DID, limit: number) => ['getSelfBlocks', uid, limit] as const;
export const getSelfBlocks: QueryFn<
	Collection<ProfilesListPage>,
	ReturnType<typeof getSelfBlocksKey>,
	string
> = async (key, { data: collection, param }) => {
	const [, uid, limit] = key;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get({
		method: 'app.bsky.graph.getBlocks',
		params: { limit, cursor: param },
	});

	const data = response.data;
	const blocks = data.blocks as BskyProfileFollow[];

	const page: ProfilesListPage = {
		cursor: blocks.length >= limit ? data.cursor : undefined,
		profiles: blocks.map((profile: BskyProfileFollow) => mergeSignalizedProfile(profile)),
	};

	return pushCollection(collection, page, param);
};

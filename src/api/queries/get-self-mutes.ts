import { type QueryFn } from '~/lib/solid-query/index.ts';

import { multiagent } from '~/globals/agent.ts';

import { mergeSignalizedProfile } from '../cache/profiles.ts';
import { type ProfilesListPage } from '../models/profiles-list.ts';

import { type BskyProfileFollow } from '../types.ts';
import { type Collection, type DID, pushCollection } from '../utils.ts';

export const getSelfMutesKey = (uid: DID, limit: number) => ['getSelfMutes', uid, limit] as const;
export const getSelfMutes: QueryFn<
	Collection<ProfilesListPage>,
	ReturnType<typeof getSelfMutesKey>,
	string
> = async (key, { data: collection, param }) => {
	const [, uid, limit] = key;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get({
		method: 'app.bsky.graph.getMutes',
		params: { limit, cursor: param },
	});

	const data = response.data;
	const mutes = data.mutes as BskyProfileFollow[];

	const page: ProfilesListPage = {
		cursor: mutes.length >= limit ? data.cursor : undefined,
		profiles: mutes.map((profile: BskyProfileFollow) => mergeSignalizedProfile(profile)),
	};

	return pushCollection(collection, page, param);
};

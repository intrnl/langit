import { type QueryFn } from '~/lib/solid-query/index.ts';

import { multiagent } from '~/globals/agent.ts';

import { mergeSignalizedProfile } from '../cache/profiles.ts';
import { type ProfilesListPage } from '../models/profiles-list.ts';

import { type BskyFollowersResponse } from '../types.ts';
import { type Collection, type DID, pushCollection } from '../utils.ts';

export const getProfileFollowersKey = (uid: DID, actor: string, limit: number) =>
	['getProfileFollowers', uid, actor, limit] as const;
export const getProfileFollowers: QueryFn<
	Collection<ProfilesListPage>,
	ReturnType<typeof getProfileFollowersKey>,
	string
> = async (key, { data: collection, param }) => {
	const [, uid, actor, limit] = key;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get({
		method: 'app.bsky.graph.getFollowers',
		params: { actor, limit, cursor: param },
	});

	const data = response.data as BskyFollowersResponse;
	const page: ProfilesListPage = {
		cursor: data.cursor,
		subject: mergeSignalizedProfile(data.subject),
		profiles: data.followers.map((profile) => mergeSignalizedProfile(profile)),
	};

	return pushCollection(collection, page, param);
};

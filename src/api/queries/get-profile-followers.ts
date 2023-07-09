import { type QueryFn } from '@intrnl/sq';

import { multiagent } from '~/globals/agent.ts';

import { mergeSignalizedProfile } from '../cache/profiles.ts';
import { type ProfilesListWithSubjectPage } from '../models/profiles-list.ts';

import { type BskyFollowersResponse } from '../types.ts';
import { type Collection, type DID, pushCollection } from '../utils.ts';

export const getProfileFollowersKey = (uid: DID, actor: string, limit: number) =>
	['getProfileFollowers', uid, actor, limit] as const;
export const getProfileFollowers: QueryFn<
	Collection<ProfilesListWithSubjectPage>,
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
	const followers = data.followers;

	const page: ProfilesListWithSubjectPage = {
		cursor: followers.length >= limit ? data.cursor : undefined,
		subject: mergeSignalizedProfile(data.subject),
		profiles: followers.map((profile) => mergeSignalizedProfile(profile)),
	};

	return pushCollection(collection, page, param);
};

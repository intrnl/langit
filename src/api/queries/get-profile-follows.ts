import type { DID } from '@intrnl/bluesky-client/atp-schema';
import type { QueryFn } from '@intrnl/sq';

import { multiagent } from '~/globals/agent.ts';

import { mergeSignalizedProfile } from '../cache/profiles.ts';
import type { ProfilesListWithSubjectPage } from '../models/profiles-list.ts';

import { type Collection, pushCollection } from '../utils.ts';

export const getProfileFollowsKey = (uid: DID, actor: string, limit: number) =>
	['getProfileFollows', uid, actor, limit] as const;
export const getProfileFollows: QueryFn<
	Collection<ProfilesListWithSubjectPage>,
	ReturnType<typeof getProfileFollowsKey>,
	string
> = async (key, { data: collection, param }) => {
	const [, uid, actor, limit] = key;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.graph.getFollows', {
		params: {
			actor: actor,
			limit: limit,
			cursor: param,
		},
	});

	const data = response.data;
	const follows = data.follows;

	const page: ProfilesListWithSubjectPage = {
		cursor: follows.length >= limit ? data.cursor : undefined,
		subject: mergeSignalizedProfile(data.subject),
		profiles: follows.map((profile) => mergeSignalizedProfile(profile)),
	};

	return pushCollection(collection, page, param);
};

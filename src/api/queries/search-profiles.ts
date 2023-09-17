import type { DID } from '@intrnl/bluesky-client/atp-schema';
import type { QueryFn } from '@intrnl/sq';

import { multiagent } from '~/globals/agent.ts';

import { mergeSignalizedProfile } from '../cache/profiles.ts';
import type { ProfilesListPage } from '../models/profiles-list.ts';

import { type Collection, pushCollection } from '../utils.ts';

export const searchProfilesKey = (uid: DID, query: string, limit = 25) => {
	return ['searchProfiles', uid, query, limit] as const;
};
export const searchProfiles: QueryFn<
	Collection<ProfilesListPage>,
	ReturnType<typeof searchProfilesKey>,
	string
> = async (key, { data: collection, param }) => {
	const [, uid, query, limit] = key;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.actor.searchActors', {
		params: {
			term: query,
			limit: limit,
			cursor: param,
		},
	});

	const data = response.data;
	const profiles = data.actors;

	const page: ProfilesListPage = {
		// cursor: profiles.length >= limit ? data.cursor : undefined,
		cursor: data.cursor,
		profiles: profiles.map((profile) => mergeSignalizedProfile(uid, profile)),
	};

	return pushCollection(collection, page, param);
};

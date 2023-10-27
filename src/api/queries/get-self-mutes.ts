import type { DID } from '@externdefs/bluesky-client/atp-schema';
import type { QueryFn } from '@intrnl/sq';

import { multiagent } from '~/globals/agent.ts';

import { mergeSignalizedProfile } from '../cache/profiles.ts';
import type { ProfilesListPage } from '../models/profiles-list.ts';

import { type Collection, pushCollection } from '../utils.ts';

export const getSelfMutesKey = (uid: DID, limit: number) => ['getSelfMutes', uid, limit] as const;
export const getSelfMutes: QueryFn<
	Collection<ProfilesListPage>,
	ReturnType<typeof getSelfMutesKey>,
	string
> = async (key, { data: collection, param }) => {
	const [, uid, limit] = key;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.graph.getMutes', {
		params: {
			limit: limit,
			cursor: param,
		},
	});

	const data = response.data;
	const mutes = data.mutes;

	const page: ProfilesListPage = {
		// cursor: mutes.length >= limit ? data.cursor : undefined,
		cursor: data.cursor,
		profiles: mutes.map((profile) => mergeSignalizedProfile(uid, profile)),
	};

	return pushCollection(collection, page, param);
};

export const getSelfMutesLatestKey = (uid: DID) => ['getSelfMutesLatest', uid] as const;
export const getSelfMutesLatest: QueryFn<
	{ did: DID | undefined },
	ReturnType<typeof getSelfMutesLatestKey>
> = async (key) => {
	const [, uid] = key;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.graph.getMutes', {
		params: {
			limit: 1,
		},
	});

	const data = response.data;
	const mutes = data.mutes;

	return { did: mutes.length > 0 ? mutes[0].did : undefined };
};

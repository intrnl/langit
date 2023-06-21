import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '~/globals/agent.ts';

import { mergeSignalizedProfile } from '../cache/profiles.ts';
import { type ProfilesListPage } from '../models/profiles-list.ts';

import { type BskyFollowersResponse } from '../types.ts';
import { type DID } from '../utils.ts';

export const getProfileFollowersKey = (uid: DID, actor: string, limit: number) =>
	['getProfileFollowers', uid, actor, limit] as const;
export const getProfileFollowers = async (
	ctx: QueryFunctionContext<ReturnType<typeof getProfileFollowersKey>>,
): Promise<ProfilesListPage> => {
	const [, uid, actor, limit] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get({
		method: 'app.bsky.graph.getFollowers',
		signal: ctx.signal,
		params: { actor, limit, cursor: ctx.pageParam },
	});

	const data = response.data as BskyFollowersResponse;

	return {
		cursor: data.cursor,
		subject: mergeSignalizedProfile(data.subject),
		profiles: data.followers.map((profile) => mergeSignalizedProfile(profile)),
	};
};

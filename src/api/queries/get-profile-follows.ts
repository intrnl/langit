import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '~/globals/agent.ts';

import { mergeSignalizedProfile } from '../cache/profiles.ts';
import { type ProfilesListPage } from '../models/profiles-list.ts';

import { type BskyFollowsResponse } from '../types.ts';
import { type DID } from '../utils.ts';

export const getProfileFollowsKey = (uid: DID, actor: string, limit: number) =>
	['getProfileFollows', uid, actor, limit] as const;
export const getProfileFollows = async (
	ctx: QueryFunctionContext<ReturnType<typeof getProfileFollowsKey>>,
): Promise<ProfilesListPage> => {
	const [, uid, actor, limit] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get({
		method: 'app.bsky.graph.getFollows',
		signal: ctx.signal,
		params: { actor, limit, cursor: ctx.pageParam },
	});

	const data = response.data as BskyFollowsResponse;

	return {
		cursor: data.cursor,
		subject: mergeSignalizedProfile(data.subject),
		profiles: data.follows.map((profile) => mergeSignalizedProfile(profile)),
	};
};

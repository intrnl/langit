import { type QueryFunctionContext } from '@tanstack/solid-query';

import { mergeSignalizedProfile } from '../cache/profiles.ts';
import { multiagent } from '../global.ts';
import { createProfilesPage } from '../models/profiles.ts';
import { type UID } from '../multiagent.ts';
import { type BskyFollowersResponse } from '../types.ts';

export const getProfileFollowersKey = (uid: UID, actor: string) => ['getProfileFollowers', uid, actor] as const;
export const createProfileFollowersQuery = (limit: number) => {
	return async (ctx: QueryFunctionContext<ReturnType<typeof getProfileFollowersKey>>) => {
		const [, uid, actor] = ctx.queryKey;

		const agent = await multiagent.connect(uid);

		const response = await agent.rpc.get({
			method: 'app.bsky.graph.getFollowers',
			signal: ctx.signal,
			params: { actor, limit, cursor: ctx.pageParam },
		});

		const data = response.data as BskyFollowersResponse;
		const profiles = createProfilesPage(data.followers);

		return {
			cursor: data.cursor,
			subject: mergeSignalizedProfile(data.subject),
			profiles: profiles,
		};
	};
};

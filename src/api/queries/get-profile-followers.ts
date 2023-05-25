import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '../global.ts';
import { createProfilesListPage } from '../models/profiles-list.ts';
import { type DID } from '../multiagent.ts';
import { type BskyFollowersResponse } from '../types.ts';

export const getProfileFollowersKey = (uid: DID, actor: string) => ['getProfileFollowers', uid, actor] as const;
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
		const page = createProfilesListPage(data.cursor, data.subject, data.followers);

		return page;
	};
};

import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '../global.ts';
import { createProfilesListPage } from '../models/profiles-list.ts';
import { type BskyFollowsResponse } from '../types.ts';
import { type DID } from '../utils.ts';

export const getProfileFollowsKey = (uid: DID, actor: string) => ['getProfileFollows', uid, actor] as const;
export const createProfileFollowsQuery = (limit: number) => {
	return async (ctx: QueryFunctionContext<ReturnType<typeof getProfileFollowsKey>>) => {
		const [, uid, actor] = ctx.queryKey;

		const agent = await multiagent.connect(uid);

		const response = await agent.rpc.get({
			method: 'app.bsky.graph.getFollows',
			signal: ctx.signal,
			params: { actor, limit, cursor: ctx.pageParam },
		});

		const data = response.data as BskyFollowsResponse;
		const page = createProfilesListPage(data.cursor, data.subject, data.follows);

		return page;
	};
};

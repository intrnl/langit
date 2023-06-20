import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '~/globals/agent.ts';

import { mergeSignalizedList } from '../cache/lists.ts';
import { type BskyGetListsResponse } from '../types.ts';
import { type DID } from '../utils.ts';

export const getProfileListsKey = (uid: DID, actor: string, limit: number) =>
	['getProfileLists', uid, actor, limit] as const;
export const getProfileLists = async (ctx: QueryFunctionContext<ReturnType<typeof getProfileListsKey>>) => {
	const [, uid, actor, limit] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get({
		method: 'app.bsky.graph.getLists',
		signal: ctx.signal,
		params: { actor, limit, cursor: ctx.pageParam },
	});

	const data = response.data as BskyGetListsResponse;

	return {
		cursor: data.cursor,
		lists: data.lists.map((list) => mergeSignalizedList(list)),
	};
};

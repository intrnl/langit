import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '~/globals/agent.ts';

import { mergeSignalizedList } from '../cache/lists.ts';
import { type ListsPage } from '../models/list.ts';

import { type BskyGetListsResponse } from '../types.ts';
import { type DID } from '../utils.ts';

export const getSubscribedListsKey = (uid: DID, limit: number, filter: boolean) =>
	['getSubscribedLists', uid, limit, filter] as const;
export const getSubscribedLists = async (
	ctx: QueryFunctionContext<ReturnType<typeof getSubscribedListsKey>>,
): Promise<ListsPage> => {
	const [, uid, limit, filter] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get({
		method: 'app.bsky.graph.getListMutes',
		signal: ctx.signal,
		params: { limit, cursor: ctx.pageParam },
	});

	const data = response.data as BskyGetListsResponse;
	const filtered = filter ? data.lists.filter((list) => list.creator.did !== uid) : data.lists;

	return {
		cursor: filtered.length > limit ? data.cursor : undefined,
		lists: filtered.map((list) => mergeSignalizedList(list)),
	};
};

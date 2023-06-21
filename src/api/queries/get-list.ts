import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '~/globals/agent.ts';

import { mergeSignalizedList } from '../cache/lists.ts';
import { mergeSignalizedProfile } from '../cache/profiles.ts';
import { type BskyGetListResponse } from '../types.ts';
import { type DID } from '../utils.ts';

import _getDid from './_did.ts';

export const getListKey = (uid: DID, actor: string, list: string, limit: number) =>
	['getList', uid, actor, list, limit] as const;
export const getList = async (ctx: QueryFunctionContext<ReturnType<typeof getListKey>>) => {
	const [, uid, actor, list, limit] = ctx.queryKey;

	const agent = await multiagent.connect(uid);
	const did = await _getDid(agent, actor, ctx.signal);

	const uri = `at://${did}/app.bsky.graph.list/${list}`;
	const response = await agent.rpc.get({
		method: 'app.bsky.graph.getList',
		signal: ctx.signal,
		params: { list: uri, limit, cursor: ctx.pageParam },
	});

	const data = response.data as BskyGetListResponse;

	return {
		cursor: data.cursor,
		list: mergeSignalizedList(data.list),
		items: data.items.map((item) => ({ subject: mergeSignalizedProfile(item.subject) })),
	};
};

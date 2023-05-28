import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '../global.ts';
import { createThreadPage } from '../models/thread.ts';
import { type BskyThreadResponse } from '../types.ts';
import { type DID } from '../utils.ts';

import _getDid from './_did.ts';

export const getPostThreadKey = (uid: DID, actor: string, post: string, depth: number, height: number) =>
	['getPostThread', uid, actor, post, depth, height] as const;
export const getPostThread = async (ctx: QueryFunctionContext<ReturnType<typeof getPostThreadKey>>) => {
	const [, uid, actor, post, depth, height] = ctx.queryKey;

	const agent = await multiagent.connect(uid);
	const did = await _getDid(agent, actor, ctx.signal);

	const uri = `at://${did}/app.bsky.feed.post/${post}`;
	const response = await agent.rpc.get({
		method: 'app.bsky.feed.getPostThread',
		signal: ctx.signal,
		params: {
			uri: uri,
			depth: depth,
			parentHeight: height,
		},
	});

	const data = response.data as BskyThreadResponse;
	const page = createThreadPage(data.thread);

	return page;
};

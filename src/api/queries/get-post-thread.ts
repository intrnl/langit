import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '../global.ts';
import { createThreadPage } from '../models/thread.ts';
import { type DID } from '../multiagent.ts';
import { type BskyThreadResponse } from '../types.ts';

import _getDid from './_did.ts';

export const getPostThreadKey = (uid: DID, actor: string, post: string) =>
	['getPostThread', uid, actor, post] as const;
export const getPostThread = async (ctx: QueryFunctionContext<ReturnType<typeof getPostThreadKey>>) => {
	const [, uid, actor, post] = ctx.queryKey;

	const agent = await multiagent.connect(uid);
	const did = await _getDid(agent, actor, ctx.signal);

	const uri = `at://${did}/app.bsky.feed.post/${post}`;
	const response = await agent.rpc.get({
		method: 'app.bsky.feed.getPostThread',
		signal: ctx.signal,
		params: { uri },
	});

	const data = response.data as BskyThreadResponse;
	const page = createThreadPage(data.thread);

	return page;
};

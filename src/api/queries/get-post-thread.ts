import { type QueryFn } from '@intrnl/sq';

import { multiagent } from '~/globals/agent.ts';

import { type ThreadPage, createThreadPage } from '../models/thread.ts';
import { type BskyThreadResponse } from '../types.ts';
import { type DID } from '../utils.ts';

import _getDid from './_did.ts';

export class BlockedThreadError extends Error {}

export const getPostThreadKey = (uid: DID, actor: string, post: string, depth: number, height: number) =>
	['getPostThread', uid, actor, post, depth, height] as const;
export const getPostThread: QueryFn<ThreadPage, ReturnType<typeof getPostThreadKey>> = async (key) => {
	const [, uid, actor, post, depth, height] = key;

	const agent = await multiagent.connect(uid);
	const did = await _getDid(agent, actor);

	const uri = `at://${did}/app.bsky.feed.post/${post}`;
	const response = await agent.rpc.get({
		method: 'app.bsky.feed.getPostThread',
		params: {
			uri: uri,
			depth: depth,
			parentHeight: height,
		},
	});

	const data = response.data as BskyThreadResponse;

	if (data.thread.$type === 'app.bsky.feed.defs#blockedPost') {
		throw new BlockedThreadError();
	}

	const page = createThreadPage(data.thread);

	return page;
};

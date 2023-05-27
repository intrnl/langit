import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '../global.ts';
import { createTimelinePage } from '../models/timeline.ts';
import { type BskyTimelineResponse } from '../types.ts';
import { type DID } from '../utils.ts';

export const getFeedKey = (uid: DID, uri: string) => ['getFeed', uid, uri] as const;
export const createFeedQuery = (limit: number) => {
	return async (ctx: QueryFunctionContext<ReturnType<typeof getFeedKey>, string>) => {
		const [, uid, uri] = ctx.queryKey;

		const agent = await multiagent.connect(uid);

		const response = await agent.rpc.get({
			method: 'app.bsky.feed.getFeed',
			signal: ctx.signal,
			params: { feed: uri, cursor: ctx.pageParam, limit },
		});

		const data = response.data as BskyTimelineResponse;
		const page = createTimelinePage(data);

		return page;
	};
};

export const getFeedLatestKey = (uid: DID, uri: string) => ['getTimelineLatest', uid, uri] as const;
export const getFeedLatest = async (ctx: QueryFunctionContext<ReturnType<typeof getFeedLatestKey>>) => {
	const [, uid, uri] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get({
		method: 'app.bsky.feed.getFeed',
		signal: ctx.signal,
		params: { feed: uri, limit: 1 },
	});

	const data = response.data as BskyTimelineResponse;
	const feed = data.feed;

	return feed.length > 0 ? feed[0].post.cid : undefined;
};

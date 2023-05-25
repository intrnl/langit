import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '../global.ts';
import { createTimelinePage } from '../models/timeline.ts';
import { type BskyTimelineResponse } from '../types.ts';
import { type DID } from '../utils.ts';

export const getTimelineKey = (uid: DID, algorithm: string) => ['getTimeline', uid, algorithm] as const;
export const createTimelineQuery = (limit: number) => {
	return async (ctx: QueryFunctionContext<ReturnType<typeof getTimelineKey>>) => {
		const [, uid, algorithm] = ctx.queryKey;

		const agent = await multiagent.connect(uid);

		const response = await agent.rpc.get({
			method: 'app.bsky.feed.getTimeline',
			signal: ctx.signal,
			params: { algorithm, cursor: ctx.pageParam, limit },
		});

		const data = response.data as BskyTimelineResponse;
		const page = createTimelinePage(data, (slice) => {
			const items = slice.items;
			const first = items[0];

			// skip any posts that are in reply to non-followed
			if (first.reply && (!first.reason || first.reason.$type !== 'app.bsky.feed.defs#reasonRepost')) {
				const parent = first.reply.parent;

				if (parent.author.did !== uid && !parent.author.viewer.following.peek()) {
					return false;
				}
			}

			return true;
		});

		return page;
	};
};

export const getTimelineLatestKey = (uid: DID, algorithm: string) =>
	['getTimelineLatest', uid, algorithm] as const;
export const getTimelineLatest = async (
	ctx: QueryFunctionContext<ReturnType<typeof getTimelineLatestKey>>,
) => {
	const [, uid, algorithm] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get({
		method: 'app.bsky.feed.getTimeline',
		signal: ctx.signal,
		params: { algorithm, limit: 1 },
	});

	const data = response.data as BskyTimelineResponse;
	const feed = data.feed;

	return feed.length > 0 ? feed[0].post.cid : undefined;
};

import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '../global.ts';
import { type SliceFilter, createTimelinePage } from '../models/timeline.ts';
import { type BskyTimelineResponse } from '../types.ts';
import { type DID } from '../utils.ts';

import { isAtpFeedUri } from '~/utils/link.ts';

const ceateHomeTimelineFilter = (uid: DID): SliceFilter => {
	return (slice) => {
		const items = slice.items;
		const first = items[0];

		// skip any posts that are in reply to non-followed
		if (first.reply && (!first.reason || first.reason.$type !== 'app.bsky.feed.defs#reasonRepost')) {
			const root = first.reply.root;
			const parent = first.reply.parent;

			if (
				(root.author.did !== uid && !root.author.viewer.following.peek()) ||
				(parent.author.did !== uid && !parent.author.viewer.following.peek())
			) {
				return false;
			}
		}

		return true;
	};
};

export const getFeedKey = (uid: DID, feed: string, limit: number) => ['getFeed', uid, feed, limit] as const;
export const getFeed = async (ctx: QueryFunctionContext<ReturnType<typeof getFeedKey>, string>) => {
	const [, uid, feed, limit] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	let data: BskyTimelineResponse;
	let filter: SliceFilter | undefined;

	if (isAtpFeedUri(feed)) {
		const response = await agent.rpc.get({
			method: 'app.bsky.feed.getFeed',
			signal: ctx.signal,
			params: { feed: feed, cursor: ctx.pageParam, limit },
		});

		data = response.data as BskyTimelineResponse;
	} else {
		const response = await agent.rpc.get({
			method: 'app.bsky.feed.getTimeline',
			signal: ctx.signal,
			params: { algorithm: feed, cursor: ctx.pageParam, limit },
		});

		data = response.data as BskyTimelineResponse;
		filter = ceateHomeTimelineFilter(uid);
	}

	const page = createTimelinePage(data, filter);

	return page;
};

export const getFeedLatestKey = (uid: DID, uri: string) => ['getTimelineLatest', uid, uri] as const;
export const getFeedLatest = async (ctx: QueryFunctionContext<ReturnType<typeof getFeedLatestKey>>) => {
	const [, uid, feed] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	let data: BskyTimelineResponse;

	if (isAtpFeedUri(feed)) {
		const response = await agent.rpc.get({
			method: 'app.bsky.feed.getFeed',
			signal: ctx.signal,
			params: { feed: feed, limit: 1 },
		});

		data = response.data as BskyTimelineResponse;
	} else {
		const response = await agent.rpc.get({
			method: 'app.bsky.feed.getTimeline',
			signal: ctx.signal,
			params: { algorithm: feed, limit: 1 },
		});

		data = response.data as BskyTimelineResponse;
	}

	const list = data.feed;

	return list.length > 0 ? list[0].post.cid : undefined;
};

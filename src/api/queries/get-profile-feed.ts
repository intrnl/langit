import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '../global.ts';
import { type UID } from '../multiagent.ts';
import { type BskyTimelineResponse } from '../types.ts';
import { createTimelinePage } from '../models/timeline.ts';

import _getDid from './_did.ts';


export const getProfileFeedKey = (uid: UID, actor: string, replies: boolean) =>
	['getProfileFeed', uid, actor, replies] as const;
export const createProfileFeedQuery = (limit: number) => {
	return async (ctx: QueryFunctionContext<ReturnType<typeof getProfileFeedKey>>) => {
		const [, uid, actor, replies] = ctx.queryKey;

		const agent = await multiagent.connect(uid);
		const did = await _getDid(agent, actor, ctx.signal);

		const response = await agent.rpc.get({
			method: 'app.bsky.feed.getAuthorFeed',
			signal: ctx.signal,
			params: { actor, cursor: ctx.pageParam, limit },
		});

		const data = response.data as BskyTimelineResponse;
		const page = createTimelinePage(data, (slice) => {
			const items = slice.items;
			const first = items[0];

			if (!replies && first.reply && (!first.reason || first.reason.$type !== 'app.bsky.feed.defs#reasonRepost')) {
				const parent = first.reply.parent;

				if (parent.author.did !== did) {
					return false;
				}
			}

			return true;
		});

		return page;
	};
};

export const getProfileFeedLatestKey = (uid: UID, actor: string) => ['getProfileFieldLatest', uid, actor] as const;
export const getProfileFeedLatest = async (ctx: QueryFunctionContext<ReturnType<typeof getProfileFeedLatestKey>>) => {
	const [, uid, actor] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get({
		method: 'app.bsky.feed.getAuthorFeed',
		signal: ctx.signal,
		params: { actor, limit: 1 },
	});

	const data = response.data as BskyTimelineResponse;
	const feed = data.feed;

	return feed.length > 0 ? feed[0].post.cid : undefined;
};

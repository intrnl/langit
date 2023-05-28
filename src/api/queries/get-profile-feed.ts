import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '../global.ts';
import { createTimelinePage } from '../models/timeline.ts';
import { type BskyTimelineResponse } from '../types.ts';
import { type DID } from '../utils.ts';

import _getDid from './_did.ts';

export const getProfileFeedKey = (uid: DID, actor: string, replies: boolean, limit: number) =>
	['getProfileFeed', uid, actor, replies, limit] as const;
export const getProfileFeed = async (ctx: QueryFunctionContext<ReturnType<typeof getProfileFeedKey>>) => {
	const [, uid, actor, replies, limit] = ctx.queryKey;

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

		if (
			!replies &&
			first.reply &&
			(!first.reason || first.reason.$type !== 'app.bsky.feed.defs#reasonRepost')
		) {
			const root = first.reply.root;
			const parent = first.reply.parent;

			if (root.author.did !== did || parent.author.did !== did) {
				return false;
			}
		}

		return true;
	});

	return page;
};

export const getProfileFeedLatestKey = (uid: DID, actor: string) =>
	['getProfileFieldLatest', uid, actor] as const;
export const getProfileFeedLatest = async (
	ctx: QueryFunctionContext<ReturnType<typeof getProfileFeedLatestKey>>,
) => {
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

import { QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from './global.ts';
import { type UID } from './multiagent.ts';
import { type BskyProfile, type BskyTimeline } from './types.ts';

import { createTimelinePage } from '~/models/timeline.ts';

export const getProfileKey = (uid: UID, actor: string) => ['getProfile', uid, actor] as const;
export const getProfile = async (ctx: QueryFunctionContext<ReturnType<typeof getProfileKey>>) => {
	const [, uid, actor] = ctx.queryKey;
	const agent = await multiagent.connect(uid);

	const res = await agent.rpc.get({
		method: 'app.bsky.actor.getProfile',
		signal: ctx.signal,
		params: { actor },
	});

	return res.data as BskyProfile;
};

export const getTimelineKey = (uid: UID, algorithm: string) => ['getTimeline', uid, algorithm] as const;
export const createTimelineQuery = (limit: number) => {
	return async (ctx: QueryFunctionContext<ReturnType<typeof getTimelineKey>>) => {
		const [, uid, algorithm] = ctx.queryKey;

		const session = multiagent.accounts[uid].session;
		const agent = await multiagent.connect(uid);

		const selfdid = session.did;

		const response = await agent.rpc.get({
			method: 'app.bsky.feed.getTimeline',
			signal: ctx.signal,
			params: { algorithm, cursor: ctx.pageParam, limit },
		});

		const data = response.data as BskyTimeline;
		const page = createTimelinePage(data, (slice) => {
			const items = slice.items;

			// skip any posts that are in reply to non-followed
			for (let idx = 0, len = items.length; idx < len; idx++) {
				const item = items[idx];

				if (item.reply && (!item.reason || item.reason.$type !== 'app.bsky.feed.defs#reasonRepost')) {
					const parent = item.reply.parent.peek();

					if (parent.author.did !== selfdid && !parent.author.viewer.following) {
						return false;
					}
				}
			}

			return true;
		});

		return page;
	};
};

export const getTimelineLatestKey = (uid: UID, algorithm: string) => ['getTimelineLatest', uid, algorithm] as const;
export const getTimelineLatest = async (ctx: QueryFunctionContext<ReturnType<typeof getTimelineLatestKey>>) => {
	const [, uid, algorithm] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get({
		method: 'app.bsky.feed.getTimeline',
		signal: ctx.signal,
		params: { algorithm, limit: 1 },
	});

	const data = response.data as BskyTimeline;
	const feed = data.feed;

	return feed.length > 0 ? feed[0].post.cid : undefined;
};

export const getProfileFeedKey = (uid: UID, actor: string, replies: boolean) =>
	['getProfileFeed', uid, actor, replies] as const;
export const createProfileFeedQuery = (limit: number) => {
	return async (ctx: QueryFunctionContext<ReturnType<typeof getProfileFeedKey>>) => {
		const [, uid, actor, replies] = ctx.queryKey;

		const agent = await multiagent.connect(uid);

		const response = await agent.rpc.get({
			method: 'app.bsky.feed.getAuthorFeed',
			signal: ctx.signal,
			params: { actor, cursor: ctx.pageParam, limit },
		});

		const data = response.data as BskyTimeline;
		const page = createTimelinePage(data, (slice) => {
			const items = slice.items;
			const first = items[0];

			if (!replies && first.reply && (!first.reason || first.reason.$type === 'app.bsky.feed.defs#reasonRepost')) {
				const parent = first.reply.parent.peek();

				if (parent.author.handle !== actor) {
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

	const data = response.data as BskyTimeline;
	const feed = data.feed;

	return feed.length > 0 ? feed[0].post.cid : undefined;
};

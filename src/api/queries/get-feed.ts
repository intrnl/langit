import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '~/globals/agent.ts';
import { systemLanguages } from '~/globals/platform.ts';
import { preferences } from '~/globals/preferences.ts';

import { type PostFilter, type SliceFilter, createTimelinePage } from '../models/timeline.ts';
import { type BskyTimelineResponse } from '../types.ts';
import { type DID } from '../utils.ts';

const createHomeSliceFilter = (uid: DID): SliceFilter => {
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
		} else if (first.post.record.peek().reply) {
			return false;
		}

		return true;
	};
};

const createFeedPostFilter = (uid: DID): PostFilter | undefined => {
	const pref = preferences.get(uid);

	const allowUnspecified = pref?.cl_unspecified ?? true;
	let languages = pref?.cl_codes;

	if (pref?.cl_systemLanguage ?? true) {
		languages = languages ? systemLanguages.concat(languages) : systemLanguages;
	}

	if (!languages || languages.length < 1) {
		return undefined;
	}

	return (item) => {
		const record = item.post.record;
		const langs = record.langs;

		if (!langs) {
			return allowUnspecified;
		}

		return langs.some((code) => languages!.includes(code));
	};
};

export const FOLLOWING_FEED = 'reverse-chronological';

export const getFeedKey = (uid: DID, feed: string, limit: number) => ['getFeed', uid, feed, limit] as const;
export const getFeed = async (ctx: QueryFunctionContext<ReturnType<typeof getFeedKey>, string>) => {
	const [, uid, feed, limit] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	let data: BskyTimelineResponse;
	let sliceFilter: SliceFilter | undefined;
	let postFilter: PostFilter | undefined;

	if (feed !== FOLLOWING_FEED) {
		const response = await agent.rpc.get({
			method: 'app.bsky.feed.getFeed',
			signal: ctx.signal,
			params: { feed: feed, cursor: ctx.pageParam, limit },
		});

		data = response.data as BskyTimelineResponse;
		postFilter = createFeedPostFilter(uid);
	} else {
		const response = await agent.rpc.get({
			method: 'app.bsky.feed.getTimeline',
			signal: ctx.signal,
			params: { algorithm: feed, cursor: ctx.pageParam, limit },
		});

		data = response.data as BskyTimelineResponse;
		sliceFilter = createHomeSliceFilter(uid);
	}

	const page = createTimelinePage(data, sliceFilter, postFilter);

	return page;
};

export const getFeedLatestKey = (uid: DID, uri: string) => ['getTimelineLatest', uid, uri] as const;
export const getFeedLatest = async (ctx: QueryFunctionContext<ReturnType<typeof getFeedLatestKey>>) => {
	const [, uid, feed] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	let data: BskyTimelineResponse;

	if (feed !== FOLLOWING_FEED) {
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

import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '../global.ts';
import { createLikesTimelinePage } from '../models/timeline.ts';
import { type UID } from '../multiagent.ts';
import { type BskyGetPostsResponse, type BskyLikeRecord, type BskyListRecordsResponse } from '../types.ts';

import _getDid from './_did.ts';

import { chunked } from '~/utils/misc.ts';

export const getProfileLikesKey = (uid: UID, actor: string) => ['getProfileLikes', uid, actor] as const;
export const createProfileLikesQuery = (limit: number) => {
	const MAX_POST_LIMIT = 25;

	return async (ctx: QueryFunctionContext<ReturnType<typeof getProfileLikesKey>>) => {
		const [, uid, actor] = ctx.queryKey;

		const agent = await multiagent.connect(uid);
		const did = await _getDid(agent, actor, ctx.signal);

		const response = await agent.rpc.get({
			method: 'com.atproto.repo.listRecords',
			signal: ctx.signal,
			params: {
				collection: 'app.bsky.feed.like',
				repo: did,
				limit: limit,
				cursor: ctx.pageParam,
			},
		});

		const data = response.data as BskyListRecordsResponse<BskyLikeRecord>;

		const postUris = data.records.map((record) => record.value.subject.uri);
		const chunkedUris = chunked(postUris, MAX_POST_LIMIT);

		const chunkedPosts = await Promise.all(
			chunkedUris.map((uris) => (
				agent.rpc.get({ method: 'app.bsky.feed.getPosts', signal: ctx.signal, params: { uris } }).then((response) => (
					(response.data as BskyGetPostsResponse).posts
				))
			)),
		);

		const page = createLikesTimelinePage(data.cursor, chunkedPosts.flat());

		return page;
	};
};

export const getProfileLikesLatestKey = (uid: UID, actor: string) => ['getProfileLikesLatest', uid, actor] as const;
export const getProfileLikesLatest = async (ctx: QueryFunctionContext<ReturnType<typeof getProfileLikesLatestKey>>) => {
	const [, uid, actor] = ctx.queryKey;

	const agent = await multiagent.connect(uid);
	const did = await _getDid(agent, actor, ctx.signal);

	const response = await agent.rpc.get({
		method: 'com.atproto.repo.listRecords',
		signal: ctx.signal,
		params: {
			collection: 'app.bsky.feed.like',
			repo: did,
			limit: 1,
		},
	});

	const data = response.data as BskyListRecordsResponse<BskyLikeRecord>;
	const records = data.records;

	return records.length > 0 ? records[0].value.subject.cid : undefined;
};

import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '~/globals/agent.ts';

import { createLikesTimelinePage } from '../models/timeline.ts';
import { type BskyLikeRecord, type BskyListRecordsResponse } from '../types.ts';
import { type DID } from '../utils.ts';

import _getDid from './_did.ts';
import { fetchPost } from './get-post.ts';

export const getProfileLikesKey = (uid: DID, actor: string, limit: number) =>
	['getProfileLikes', uid, actor, limit] as const;
export const getProfileLikes = async (ctx: QueryFunctionContext<ReturnType<typeof getProfileLikesKey>>) => {
	const [, uid, actor, limit] = ctx.queryKey;

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
	const posts = await Promise.all(postUris.map((uri) => fetchPost([uid, uri])));

	const page = createLikesTimelinePage(data.cursor, posts.flat());

	return page;
};

export const getProfileLikesLatestKey = (uid: DID, actor: string) =>
	['getProfileLikesLatest', uid, actor] as const;
export const getProfileLikesLatest = async (
	ctx: QueryFunctionContext<ReturnType<typeof getProfileLikesLatestKey>>,
) => {
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

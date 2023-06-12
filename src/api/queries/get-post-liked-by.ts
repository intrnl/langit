import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '~/globals/agent.ts';

import { createPostProfilesListPage } from '../models/profiles-list.ts';
import { type DID } from '../utils.ts';
import { type BskyLikedByResponse } from '../types.ts';

import _getDid from './_did.ts';

export const getPostLikedByKey = (uid: DID, actor: string, post: string, limit: number) =>
	['getPostLikes', uid, actor, post, limit] as const;
export const getPostLikedBy = async (
	ctx: QueryFunctionContext<ReturnType<typeof getPostLikedByKey>, string>,
) => {
	const [, uid, actor, post, limit] = ctx.queryKey;

	const agent = await multiagent.connect(uid);
	const did = await _getDid(agent, actor, ctx.signal);

	const uri = `at://${did}/app.bsky.feed.post/${post}`;
	const response = await agent.rpc.get({
		method: 'app.bsky.feed.getLikes',
		signal: ctx.signal,
		params: { uri, limit, cursor: ctx.pageParam },
	});

	const data = response.data as BskyLikedByResponse;
	const page = createPostProfilesListPage(
		data.cursor,
		data.likes.map((like) => like.actor),
	);

	return page;
};

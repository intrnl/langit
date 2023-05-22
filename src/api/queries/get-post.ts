import { type QueryFunctionContext } from '@tanstack/solid-query';

import { mergeSignalizedPost } from '../cache/posts.ts';
import { multiagent } from '../global.ts';
import { type DID } from '../multiagent.ts';
import { type BskyGetPostsResponse } from '../types.ts';

export const getPostKey = (uid: DID, uri: string) => ['getPost', uid, uri] as const;
export const getPost = async (ctx: QueryFunctionContext<ReturnType<typeof getPostKey>>) => {
	const [, uid, uri] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get({
		method: 'app.bsky.feed.getPosts',
		signal: ctx.signal,
		params: { uris: [uri] },
	});

	const data = response.data as BskyGetPostsResponse;
	const posts = data.posts;

	if (posts.length > 0) {
		const signalized = mergeSignalizedPost(posts[0]);
		return signalized;
	}

	throw new Error(`Post not found`);
};

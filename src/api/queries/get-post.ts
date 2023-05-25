import { type QueryFunctionContext } from '@tanstack/solid-query';

import { mergeSignalizedPost } from '../cache/posts.ts';
import { multiagent } from '../global.ts';
import { type BskyGetPostsResponse, type BskyPost } from '../types.ts';
import { type DID } from '../utils.ts';

import { createBatchedFetch } from '~/utils/batch-fetch.ts';

type Query = ReturnType<typeof getPostKey>;

const fetchPost = createBatchedFetch<Query, string, BskyPost>({
	limit: 25,
	timeout: 0,
	key: (query) => query[1],
	idFromQuery: (query) => query[2],
	idFromData: (data) => data.uri,
	fetch: async (queries) => {
		const uid = queries[0][1];
		const uris = queries.map((query) => query[2]);

		const agent = await multiagent.connect(uid);

		const response = await agent.rpc.get({
			method: 'app.bsky.feed.getPosts',
			params: { uris: uris },
		});

		const data = response.data as BskyGetPostsResponse;

		return data.posts;
	},
});

export const getPostKey = (uid: DID, uri: string) => ['getPost', uid, uri] as const;
export const getPost = async (ctx: QueryFunctionContext<ReturnType<typeof getPostKey>>) => {
	const post = await fetchPost(ctx.queryKey);

	return mergeSignalizedPost(post);
};

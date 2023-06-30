import { type InitialDataFn, type QueryFn } from '@intrnl/sq';

import { multiagent } from '~/globals/agent.ts';
import { createBatchedFetch } from '~/utils/batch-fetch.ts';
import { BSKY_POST_URL_RE, isAppUrl } from '~/utils/link.ts';

import { type SignalizedPost, mergeSignalizedPost, posts } from '../cache/posts.ts';
import { type BskyGetPostsResponse, type BskyPost } from '../types.ts';
import { type DID } from '../utils.ts';

import _getDid from './_did.ts';

type Query = [uid: DID, uri: string];

export const fetchPost = createBatchedFetch<Query, string, BskyPost>({
	limit: 25,
	timeout: 0,
	key: (query) => query[0],
	idFromQuery: (query) => query[1],
	idFromData: (data) => data.uri,
	fetch: async (queries) => {
		const uid = queries[0][0];
		const uris = queries.map((query) => query[1]);

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
export const getPost: QueryFn<SignalizedPost, ReturnType<typeof getPostKey>> = async (key) => {
	const [, uid, uri] = key;

	const bskyMatch = isAppUrl(uri) && BSKY_POST_URL_RE.exec(uri);

	let resolvedUri = uri;
	if (bskyMatch) {
		const agent = await multiagent.connect(uid);

		const repo = await _getDid(agent, bskyMatch[1]);
		const record = bskyMatch[2];

		resolvedUri = `at://${repo}/app.bsky.feed.post/${record}`;
	}

	const post = await fetchPost([uid, resolvedUri]);

	return mergeSignalizedPost(post);
};

export const getInitialPost: InitialDataFn<SignalizedPost, ReturnType<typeof getPostKey>> = (key) => {
	const [, , uri] = key;

	const ref = posts[uri];
	const post = ref?.deref();

	return post && { data: post };
};

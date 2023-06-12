import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '~/globals/agent.ts';
import { createBatchedFetch } from '~/utils/batch-fetch.ts';
import { BSKY_FEED_URL_RE, isBskyFeedUrl } from '~/utils/link.ts';

import { mergeSignalizedFeedGenerator } from '../cache/feed-generators.ts';
import { type BskyFeedGenerator, type BskyGetFeedGeneratorsResponse } from '../types.ts';
import { type DID } from '../utils.ts';

import _getDid from './_did.ts';

type Query = [uid: DID, uri: string];

const fetchFeedGenerator = createBatchedFetch<Query, string, BskyFeedGenerator>({
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
			method: 'app.bsky.feed.getFeedGenerators',
			params: { feeds: uris },
		});

		const data = response.data as BskyGetFeedGeneratorsResponse;

		return data.feeds;
	},
});

export const createFeedGeneratorUri = (actor: DID, feed: string) => {
	return `at://${actor}/app.bsky.feed.generator/${feed}`;
};

export const getFeedGeneratorKey = (uid: DID, uri: string) => ['getFeedGenerator', uid, uri] as const;
export const getFeedGenerator = async (ctx: QueryFunctionContext<ReturnType<typeof getFeedGeneratorKey>>) => {
	const [, uid, uri] = ctx.queryKey;

	const bskyMatch = isBskyFeedUrl(uri) && BSKY_FEED_URL_RE.exec(uri);

	let resolvedUri = uri;
	if (bskyMatch) {
		const agent = await multiagent.connect(uid);

		const repo = await _getDid(agent, bskyMatch[1], ctx.signal);
		const record = bskyMatch[2];

		resolvedUri = createFeedGeneratorUri(repo, record);
	}

	const feedGenerator = await fetchFeedGenerator([uid, resolvedUri]);

	return mergeSignalizedFeedGenerator(feedGenerator);
};

export const getPopularFeedGeneratorsKey = (uid: DID) => ['getPopularFeedGenerators', uid] as const;
export const getPopularFeedGenerators = async (
	ctx: QueryFunctionContext<ReturnType<typeof getPopularFeedGeneratorsKey>>,
) => {
	const [, uid] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get({
		method: 'app.bsky.unspecced.getPopularFeedGenerators',
	});

	// returns the same structure so let's just reuse the type
	const data = response.data as BskyGetFeedGeneratorsResponse;
	const key = Date.now();

	return data.feeds.map((feed) => mergeSignalizedFeedGenerator(feed, key));
};

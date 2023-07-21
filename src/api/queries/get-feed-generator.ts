import type { DID, RefOf } from '@intrnl/bluesky-client/atp-schema';
import type { InitialDataFn, QueryFn } from '@intrnl/sq';

import { multiagent } from '~/globals/agent.ts';
import { createBatchedFetch } from '~/utils/batch-fetch.ts';
import { BSKY_FEED_URL_RE, isBskyFeedUrl } from '~/utils/link.ts';

import { pushCollection, type Collection } from '../utils.ts';

import {
	type SignalizedFeedGenerator,
	feedGenerators,
	mergeSignalizedFeedGenerator,
} from '../cache/feed-generators.ts';

import _getDid from './_did.ts';

type FeedGenerator = RefOf<'app.bsky.feed.defs#generatorView'>;

type Query = [uid: DID, uri: string];

const fetchFeedGenerator = createBatchedFetch<Query, string, FeedGenerator>({
	limit: 25,
	timeout: 0,
	key: (query) => query[0],
	idFromQuery: (query) => query[1],
	idFromData: (data) => data.uri,
	fetch: async (queries) => {
		const uid = queries[0][0];
		const uris = queries.map((query) => query[1]);

		const agent = await multiagent.connect(uid);

		const response = await agent.rpc.get('app.bsky.feed.getFeedGenerators', {
			params: { feeds: uris },
		});

		return response.data.feeds;
	},
});

export const createFeedGeneratorUri = (actor: DID, feed: string) => {
	return `at://${actor}/app.bsky.feed.generator/${feed}`;
};

export const getFeedGeneratorKey = (uid: DID, uri: string) => ['getFeedGenerator', uid, uri] as const;
export const getFeedGenerator: QueryFn<
	SignalizedFeedGenerator,
	ReturnType<typeof getFeedGeneratorKey>
> = async (key) => {
	const [, uid, uri] = key;

	const bskyMatch = isBskyFeedUrl(uri) && BSKY_FEED_URL_RE.exec(uri);

	let resolvedUri = uri;
	if (bskyMatch) {
		const agent = await multiagent.connect(uid);

		const repo = await _getDid(agent, bskyMatch[1]);
		const record = bskyMatch[2];

		resolvedUri = createFeedGeneratorUri(repo, record);
	}

	const feedGenerator = await fetchFeedGenerator([uid, resolvedUri]);

	return mergeSignalizedFeedGenerator(feedGenerator);
};

export const getInitialFeedGenerator: InitialDataFn<
	SignalizedFeedGenerator,
	ReturnType<typeof getFeedGeneratorKey>
> = (key) => {
	const [, , uri] = key;

	const ref = feedGenerators[uri];
	const feed = ref?.deref();

	return feed && { data: feed };
};

export interface PopularFeedGeneratorsPage {
	cursor?: string;
	feeds: SignalizedFeedGenerator[];
}

export const getPopularFeedGeneratorsKey = (uid: DID, search?: string, limit = 50) =>
	['getPopularFeedGenerators', uid, search, limit] as const;
export const getPopularFeedGenerators: QueryFn<
	Collection<PopularFeedGeneratorsPage>,
	ReturnType<typeof getPopularFeedGeneratorsKey>,
	string
> = async (key, { data: collection, param }) => {
	const [, uid, search, limit] = key;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.unspecced.getPopularFeedGenerators', {
		params: {
			cursor: param,
			limit: limit,
			query: search,
		},
	});

	const data = response.data;
	const feeds = data.feeds;

	const page: PopularFeedGeneratorsPage = {
		cursor: feeds.length >= limit ? data.cursor : undefined,
		feeds: feeds.map((feed) => mergeSignalizedFeedGenerator(feed)),
	};

	return pushCollection(collection, page, param);
};

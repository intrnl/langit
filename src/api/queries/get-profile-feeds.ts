import type { DID } from '@intrnl/bluesky-client/atp-schema';
import type { QueryFn } from '@intrnl/sq';

import { multiagent } from '~/globals/agent.ts';

import { mergeSignalizedFeedGenerator } from '~/api/cache/feed-generators.ts';
import type { FeedsPage } from '~/api/models/feeds.ts';

import { type Collection, pushCollection } from '~/api/utils.ts';

export const getProfileFeedsKey = (uid: DID, actor: string, limit: number = 30) => {
	return ['getProfileFeeds', uid, actor, limit] as const;
};
export const getProfileFeeds: QueryFn<
	Collection<FeedsPage>,
	ReturnType<typeof getProfileFeedsKey>,
	string
> = async (key, { data: collection, param }) => {
	const [, uid, actor, limit] = key;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.feed.getActorFeeds', {
		params: {
			actor: actor,
			limit: limit,
			cursor: param,
		},
	});

	const data = response.data;
	const feeds = data.feeds;

	const page: FeedsPage = {
		// cursor: feeds.length >= limit ? data.cursor : undefined,
		cursor: data.cursor,
		feeds: feeds.map((feed) => mergeSignalizedFeedGenerator(uid, feed)),
	};

	return pushCollection(collection, page, param);
};

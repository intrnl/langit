import type { DID, Records } from '@intrnl/bluesky-client/atp-schema';

import { multiagent } from '~/globals/agent.ts';

import type { SignalizedFeedGenerator } from '../cache/feed-generators.ts';
import { getCurrentDate, getRecordId } from '../utils.ts';

import { acquire } from './_locker.ts';

type LikeRecord = Records['app.bsky.feed.like'];

export const favoriteFeed = (uid: DID, feed: SignalizedFeedGenerator) => {
	return acquire(feed.viewer.like, async () => {
		const agent = await multiagent.connect(uid);

		const prev = feed.viewer.like.peek();

		if (prev) {
			await agent.rpc.call('com.atproto.repo.deleteRecord', {
				data: {
					collection: 'app.bsky.feed.like',
					repo: uid,
					rkey: getRecordId(prev),
				},
			});

			feed.viewer.like.value = undefined;
			feed.likeCount.value--;
		} else {
			const record: LikeRecord = {
				createdAt: getCurrentDate(),
				subject: {
					cid: feed.cid.value,
					uri: feed.uri,
				},
			};

			const response = await agent.rpc.call('com.atproto.repo.createRecord', {
				data: {
					repo: uid,
					collection: 'app.bsky.feed.like',
					record: record,
				},
			});

			feed.viewer.like.value = response.data.uri;
			feed.likeCount.value++;
		}
	});
};

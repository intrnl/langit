import type { DID, Records } from '@intrnl/bluesky-client/atp-schema';

import { multiagent } from '~/globals/agent.ts';

import type { SignalizedPost } from '../cache/posts.ts';
import { getCurrentDate, getRecordId } from '../utils.ts';

import { acquire } from './_locker.ts';

type LikeRecord = Records['app.bsky.feed.like'];

export const favoritePost = (uid: DID, post: SignalizedPost) => {
	return acquire(post.viewer.like, async () => {
		const agent = await multiagent.connect(uid);

		const prev = post.viewer.like.peek();

		if (prev) {
			await agent.rpc.call('com.atproto.repo.deleteRecord', {
				data: {
					collection: 'app.bsky.feed.like',
					repo: uid,
					rkey: getRecordId(prev),
				},
			});

			post.viewer.like.value = undefined;
			post.likeCount.value--;
		} else {
			const record: LikeRecord = {
				createdAt: getCurrentDate(),
				subject: {
					cid: post.cid.value,
					uri: post.uri,
				},
			};

			const response = await agent.rpc.call('com.atproto.repo.createRecord', {
				data: {
					repo: uid,
					collection: 'app.bsky.feed.like',
					record: record,
				},
			});

			post.viewer.like.value = response.data.uri;
			post.likeCount.value++;
		}
	});
};

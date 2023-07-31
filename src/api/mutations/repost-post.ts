import type { DID, Records } from '@intrnl/bluesky-client/atp-schema';

import { multiagent } from '~/globals/agent.ts';

import type { SignalizedPost } from '../cache/posts.ts';
import { getCurrentDate, getRecordId } from '../utils.ts';

import { acquire } from './_locker.ts';

type RepostRecord = Records['app.bsky.feed.repost'];

export const repostPost = (uid: DID, post: SignalizedPost) => {
	return acquire(post.viewer.repost, async () => {
		const agent = await multiagent.connect(uid);

		const prev = post.viewer.repost.peek();

		if (prev) {
			await agent.rpc.call('com.atproto.repo.deleteRecord', {
				data: {
					collection: 'app.bsky.feed.repost',
					repo: uid,
					rkey: getRecordId(prev),
				},
			});

			post.viewer.repost.value = undefined;
			post.repostCount.value--;
		} else {
			const record: RepostRecord = {
				createdAt: getCurrentDate(),
				subject: {
					cid: post.cid.value,
					uri: post.uri,
				},
			};

			const response = await agent.rpc.call('com.atproto.repo.createRecord', {
				data: {
					repo: uid,
					collection: 'app.bsky.feed.repost',
					record: record,
				},
			});

			post.viewer.repost.value = response.data.uri;
			post.repostCount.value++;
		}
	});
};

import type { DID } from '@externdefs/bluesky-client/atp-schema';

import { multiagent } from '~/globals/agent.ts';

import type { SignalizedPost } from '../cache/posts.ts';
import { getRecordId } from '../utils.ts';

import { acquire } from './_locker.ts';

export const deletePost = (uid: DID, post: SignalizedPost) => {
	if (post.$deleted.value) {
		return Promise.resolve();
	}

	return acquire(post.$deleted, async () => {
		const agent = await multiagent.connect(uid);

		await agent.rpc.call('com.atproto.repo.deleteRecord', {
			data: {
				collection: 'app.bsky.feed.post',
				repo: uid,
				rkey: getRecordId(post.uri),
			},
		});

		post.$deleted.value = true;
	});
};

import { type SignalizedPost } from '../cache/posts.ts';
import { multiagent } from '../global.ts';
import { type DID, getRecordId } from '../utils.ts';

import { acquire } from './_locker.ts';

export const deletePost = (uid: DID, post: SignalizedPost) => {
	if (post.$deleted.value) {
		return Promise.resolve();
	}

	return acquire(post.$deleted, async () => {
		const agent = await multiagent.connect(uid);

		await agent.rpc.post({
			method: 'com.atproto.repo.deleteRecord',
			data: {
				collection: 'app.bsky.feed.post',
				repo: uid,
				rkey: getRecordId(post.uri),
			},
		});

		post.$deleted.value = true;
	});
};

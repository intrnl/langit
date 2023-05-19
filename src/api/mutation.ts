import { type SignalizedPost } from './cache.ts';
import { multiagent } from './global.ts';
import { type BskyCreateRecordResponse } from './types.ts';
import { getPostId } from './utils.ts';

const locked = new WeakMap<any, boolean>();

const acquire = async (value: any, callback: () => Promise<void>) => {
	if (locked.has(value)) {
		return;
	}

	locked.set(value, true);

	try {
		const result = await callback();
		return result;
	}
	finally {
		locked.delete(value);
	}
};

export const favoritePost = (uid: string, post: SignalizedPost) => {
	return acquire(post, async () => {
		const session = multiagent.accounts[uid].session;
		const agent = await multiagent.connect(uid);

		const prev = post.viewer.like.peek();

		if (prev) {
			await agent.rpc.post({
				method: 'com.atproto.repo.deleteRecord',
				data: {
					collection: 'app.bsky.feed.like',
					repo: session.did,
					rkey: getPostId(prev),
				},
			});

			post.viewer.like.value = undefined;
			post.likeCount.value--;
		}
		else {
			const response = await agent.rpc.post({
				method: 'com.atproto.repo.createRecord',
				data: {
					repo: session.did,
					collection: 'app.bsky.feed.like',
					record: {
						$type: 'app.bsky.feed.like',
						createdAt: new Date(),
						subject: {
							cid: post.cid,
							uri: post.uri,
						},
					},
				},
			});

			const data = response.data as BskyCreateRecordResponse;

			post.viewer.like.value = data.uri;
			post.likeCount.value++;
		}
	});
};

export const repostPost = (uid: string, post: SignalizedPost) => {
	return acquire(post, async () => {
		const session = multiagent.accounts[uid].session;
		const agent = await multiagent.connect(uid);

		const prev = post.viewer.repost.peek();

		if (prev) {
			await agent.rpc.post({
				method: 'com.atproto.repo.deleteRecord',
				data: {
					collection: 'app.bsky.feed.repost',
					repo: session.did,
					rkey: getPostId(prev),
				},
			});

			post.viewer.repost.value = undefined;
			post.repostCount.value--;
		}
		else {
			const response = await agent.rpc.post({
				method: 'com.atproto.repo.createRecord',
				data: {
					repo: session.did,
					collection: 'app.bsky.feed.repost',
					record: {
						$type: 'app.bsky.feed.repost',
						createdAt: new Date(),
						subject: {
							cid: post.cid,
							uri: post.uri,
						},
					},
				},
			});

			const data = response.data as BskyCreateRecordResponse;

			post.viewer.repost.value = data.uri;
			post.repostCount.value++;
		}
	});
};

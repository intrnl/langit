import { type SignalizedPost } from './cache.ts';
import { multiagent } from './global.ts';
import { type BskyCreateRecordResponse } from './types.ts';
import { getPostId } from './utils.ts';

import { Locker } from '~/utils/lock.ts';

const locks = new WeakMap<any, Locker<void>>();

const acquireLock = (value: any) => {
	let locker = locks.get(value);

	if (!locker) {
		locks.set(value, locker = new Locker(undefined));
	}

	return locker.acquire();
};

export const favoritePost = async (uid: string, post: SignalizedPost) => {
	const session = multiagent.accounts[uid].session;
	const agent = await multiagent.connect(uid);

	const lock = await acquireLock(post);

	const prev = post.viewer.like.peek();

	try {
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
	}
	finally {
		lock.release();
	}
};

export const repostPost = async (uid: string, post: SignalizedPost) => {
	const session = multiagent.accounts[uid].session;
	const agent = await multiagent.connect(uid);

	const lock = await acquireLock(post);

	const prev = post.viewer.repost.peek();

	try {
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
	}
	finally {
		lock.release();
	}
};

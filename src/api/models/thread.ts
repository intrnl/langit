import type { RefOf, UnionOf } from '@intrnl/bluesky-client/atp-schema';

import { type SignalizedPost, mergeSignalizedPost } from '../cache/posts.ts';

import { Stack } from '~/utils/stack.ts';

type Post = RefOf<'app.bsky.feed.defs#postView'>;
type Thread = RefOf<'app.bsky.feed.defs#threadViewPost'>;

type BlockedPost = UnionOf<'app.bsky.feed.defs#blockedPost'>;
type NotFoundPost = UnionOf<'app.bsky.feed.defs#notFoundPost'>;

const calculatePostScore = (post: Post, parent: Post) => {
	const isSameAuthor = parent.author.did === post.author.did;
	const isFollowing = !!post.author.viewer?.following;

	return (
		1 *
		((post.replyCount ?? 0) * 0.5 + (post.repostCount ?? 0) * 1 + (post.likeCount ?? 0) * 1) *
		(isSameAuthor ? 1.5 : 1) *
		(isFollowing ? 1.35 : 1)
	);
};

export interface ThreadSlice {
	items: [...items: SignalizedPost[], last: SignalizedPost | NotFoundPost | BlockedPost];
}

export interface ThreadPage {
	post: SignalizedPost;
	ancestors: [first: SignalizedPost | NotFoundPost | BlockedPost, ...items: SignalizedPost[]];
	descendants: ThreadSlice[];
}

type ThreadStackNode = { thread: Thread; slice: ThreadSlice | undefined };

export const createThreadPage = (data: Thread): ThreadPage => {
	const ancestors: (SignalizedPost | NotFoundPost | BlockedPost)[] = [];
	const descendants: ThreadSlice[] = [];

	const stack = new Stack<ThreadStackNode>();

	let parent = data.parent;
	let node: ThreadStackNode | undefined;

	stack.push({ thread: data, slice: undefined });

	while (parent) {
		if (parent.$type !== 'app.bsky.feed.defs#threadViewPost') {
			ancestors.push(parent);
			break;
		}

		ancestors.push(mergeSignalizedPost(parent.post));
		parent = parent.parent;
	}

	while ((node = stack.pop())) {
		const thread = node.thread;
		const slice = node.slice;

		if (!thread.replies) {
			continue;
		}

		const post = thread.post;
		const scores: Record<string, number> = {};

		const replies = thread.replies.slice().sort((a, b) => {
			if (
				a.$type === 'app.bsky.feed.defs#blockedPost' ||
				b.$type === 'app.bsky.feed.defs#blockedPost' ||
				a.$type === 'app.bsky.feed.defs#notFoundPost' ||
				b.$type === 'app.bsky.feed.defs#notFoundPost'
			) {
				return 0;
			}

			const aPost = a.post;
			const bPost = b.post;

			const aScore = (scores[aPost.cid] ??= calculatePostScore(aPost, post));
			const bScore = (scores[bPost.cid] ??= calculatePostScore(bPost, post));

			return bScore - aScore;
		});

		if (!slice) {
			// we're in the root thread
			for (let idx = 0, len = replies.length; idx < len; idx++) {
				const reply = replies[idx];

				if (reply.$type === 'app.bsky.feed.defs#threadViewPost') {
					const next: ThreadSlice = { items: [mergeSignalizedPost(reply.post)] };

					stack.push({ thread: reply, slice: next });
					descendants.push(next);
				} else {
					descendants.push({ items: [reply] });
				}
			}
		} else if (replies.length > 0) {
			const reply = replies[0];

			if (reply.$type === 'app.bsky.feed.defs#threadViewPost') {
				const post = mergeSignalizedPost(reply.post);

				slice.items.push(post);
				stack.push({ thread: reply, slice: slice });
			} else {
				slice.items.push(reply);
			}
		}
	}

	return {
		post: mergeSignalizedPost(data.post),
		ancestors: ancestors.reverse() as any,
		descendants: descendants,
	};
};

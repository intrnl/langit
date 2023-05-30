import { type SignalizedPost, createSignalizedLinearThread } from '../cache/posts.ts';
import { type BskyPost, type BskyThread, type LinearizedThread } from '../types.ts';

import { Stack } from '~/utils/stack.ts';

const calculatePostScore = (post: BskyPost, parent: BskyPost) => {
	const isSameAuthor = parent.author.did === post.author.did;
	const isFollowing = !!post.author.viewer.following;
	const isLiked = !!(post.viewer.like || post.viewer.repost);

	return (
		1 *
		(post.replyCount * 0.5 + post.repostCount * 1 + post.likeCount * 1) *
		(isSameAuthor ? 1.5 : 1) *
		(isFollowing ? 1.25 : 1) *
		(isLiked ? 1.15 : 1)
	);
};

const linearizeThread = (thread: BskyThread): LinearizedThread => {
	const ancestors: BskyPost[] = [];
	const descendants: BskyPost[] = [];

	const stack = new Stack<BskyThread>();

	let parent = thread.parent;
	let node: BskyThread | undefined;

	let parentNotFound = false;

	stack.push(thread);

	while (parent) {
		if (parent.$type === 'app.bsky.feed.defs#notFoundPost') {
			parentNotFound = true;
			break;
		}

		ancestors.push(parent.post);
		parent = parent.parent;
	}

	while ((node = stack.pop())) {
		// skip any nodes that doesn't have a replies array, think this might be
		// when we reach the depth limit? not certain.
		const post = node.post;

		if (!node.replies) {
			if (node !== thread) {
				descendants.push(post);
			}

			continue;
		}

		const replies = node.replies.slice();
		const scores: Record<string, number> = {};

		if (node !== thread) {
			descendants.push(post);
		}

		replies.sort((a, b) => {
			if (a.$type === 'app.bsky.feed.defs#blockedPost' || b.$type === 'app.bsky.feed.defs#blockedPost') {
				return 0;
			}

			const aPost = a.post;
			const bPost = b.post;

			const aScore = (scores[aPost.cid] ??= calculatePostScore(aPost, post));
			const bScore = (scores[bPost.cid] ??= calculatePostScore(bPost, post));

			return bScore - aScore;
		});

		// this is LIFO, and we want the first reply to be processed first, so we
		// have to loop starting from the back and not the front.
		for (let idx = replies.length - 1; idx >= 0; idx--) {
			const child = replies[idx];

			if (child.$type === 'app.bsky.feed.defs#blockedPost') {
				continue;
			}

			stack.push(child);
		}
	}

	ancestors.reverse();

	return {
		post: thread.post,
		parentNotFound,
		ancestors,
		descendants,
	};
};

export interface ThreadSlice {
	items: SignalizedPost[];
}

const isChildOf = (cid: string, child: SignalizedPost) => {
	const reply = child.record.peek().reply;

	return !!reply && reply.parent.cid === cid;
};

const isNextInThread = (slice: ThreadSlice, child: SignalizedPost) => {
	const reply = child.record.peek().reply;

	const items = slice.items;
	const last = items[items.length - 1];

	return !!reply && last.cid == reply.parent.cid;
};

export interface ThreadPage {
	post: SignalizedPost;
	parentNotFound: boolean;
	ancestors?: ThreadSlice;
	descendants: ThreadSlice[];
}

export const createThreadPage = (data: BskyThread): ThreadPage => {
	const thread = createSignalizedLinearThread(linearizeThread(data));

	const cid = thread.post.cid;
	const ancestors = thread.ancestors;
	const descendants = thread.descendants;

	const slices: ThreadSlice[] = [];
	let jlen = 0;

	for (let idx = 0, len = descendants.length; idx < len; idx++) {
		const post = descendants[idx];

		if (isChildOf(cid, post)) {
			slices.push({ items: [post] });
			jlen++;

			continue;
		}

		if (jlen > 0) {
			const slice = slices[jlen - 1];

			if (isNextInThread(slice, post)) {
				slice.items.push(post);
				continue;
			}
		}
	}

	return {
		post: thread.post,
		parentNotFound: thread.parentNotFound,
		ancestors: ancestors.length > 0 ? { items: ancestors } : undefined,
		descendants: slices,
	};
};

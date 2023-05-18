import { signalizeLinearThread } from '~/api/cache.ts';
import { type BskyPost, type BskyThread, type LinearizedThread } from '~/api/types.ts';

import { type Signal } from '~/utils/signals.ts';
import { Stack } from '~/utils/stack.ts';

const calculatePostScore = (post: BskyPost) => {
	return (post.replyCount) + (post.repostCount) + (post.likeCount);
};

const linearizeThread = (thread: BskyThread): LinearizedThread => {
	const ancestors: BskyPost[] = [];
	const descendants: BskyPost[] = [];

	const stack = new Stack<BskyThread>();

	let parent = thread.parent;
	let node: BskyThread | undefined;

	stack.push(thread);

	while (parent) {
		ancestors.push(parent.post);
		parent = parent.parent;
	}

	while (node = stack.pop()) {
		// skip any nodes that doesn't have a replies array, think this might be
		// when we reach the depth limit? not certain.
		if (!node.replies) {
			continue;
		}

		const replies = node.replies.slice();

		if (node !== thread) {
			const scores: Record<string, number> = {};

			descendants.push(node.post);

			// sort replies by their score
			replies.sort((a, b) => {
				const aPost = a.post;
				const bPost = b.post;

				const aScore = scores[aPost.cid] ??= calculatePostScore(aPost);
				const bScore = scores[bPost.cid] ??= calculatePostScore(bPost);

				return bScore - aScore;
			});
		}

		// this is LIFO, and we want the first reply to be processed first, so we
		// have to loop starting from the back and not the front.
		for (let idx = replies.length - 1; idx >= 0; idx--) {
			const child = replies[idx];
			stack.push(child);
		}
	}

	ancestors.reverse();

	return {
		post: thread.post,
		ancestors,
		descendants,
	};
};

export interface ThreadSlice {
	items: Signal<BskyPost>[];
}

const isChildOf = (cid: string, child: BskyPost) => {
	const reply = child.record.reply;

	return !!reply && (reply.parent.cid === cid);
};

const isNextInThread = (slice: ThreadSlice, child: BskyPost) => {
	const reply = child.record.reply;

	const items = slice.items;
	const last = items[items.length - 1];

	return !!reply && (last.peek().cid === reply.parent.cid);
};

export interface ThreadPage {
	post: Signal<BskyPost>;
	ancestors: Signal<BskyPost>[];
	descendants: ThreadSlice[];
}

export const createThreadPage = (data: BskyThread): ThreadPage => {
	const thread = signalizeLinearThread(linearizeThread(data));

	const cid = thread.post.peek().cid;
	const descendants = thread.descendants;

	const slices: ThreadSlice[] = [];
	let jlen = 0;

	for (let idx = 0, len = descendants.length; idx < len; idx++) {
		const post = descendants[idx];
		const peek = post.peek();

		if (isChildOf(cid, peek)) {
			slices.push({ items: [post] });
			jlen++;

			continue;
		}

		if (jlen > 0) {
			const slice = slices[jlen - 1];

			if (isNextInThread(slice, peek)) {
				slice.items.push(post);
				continue;
			}
		}
	}

	return {
		post: thread.post,
		ancestors: thread.ancestors,
		descendants: slices,
	};
};

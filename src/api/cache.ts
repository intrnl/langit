// we keep a global cache outside of tanstack-query because these records can be
// returned in multiple places, e.g. you open a post and then one of its replies

// in that one example, we can feed some initial data to tanstack-query so you
// can at least see the reply and its parents while the app tries to get the
// replies for that one

// this is a form of normalized caching

import { type Signal, signal } from '~/utils/signals.ts';

import { type BskyPost, type BskyProfileBasic, type LinearizedThread, SignalizedLinearThread } from './types.ts';

export const postAuthors: Record<string, WeakRef<Signal<BskyProfileBasic>>> = {};
export const posts: Record<string, WeakRef<Signal<BskyPost>>> = {};

export const signalizePost = (post: BskyPost, key?: number) => {
	let ref: WeakRef<Signal<BskyPost>> | undefined = posts[post.cid];
	let signalized: Signal<BskyPost>;

	if (!ref || !(signalized = ref.deref()!)) {
		signalized = signal(post);
		posts[post.cid] = new WeakRef(signalized);
	}
	else if (signalized) {
		// Prevent further updates if if the post currently contains that key
		if (!key || signalized.peek().$key !== key) {
			signalized.value = post;
		}
	}

	return signalized;
};

export const signalizeLinearThread = (thread: LinearizedThread, key?: number): SignalizedLinearThread => {
	const anc = thread.ancestors;
	const dec = thread.descendants;

	const anclen = anc.length;
	const declen = dec.length;

	const ancestors: Signal<BskyPost>[] = new Array(anclen);
	const descendants: Signal<BskyPost>[] = new Array(declen);

	for (let idx = 0; idx < anclen; idx++) {
		const post = anc[idx];
		ancestors[idx] = signalizePost(post, key);
	}

	for (let idx = 0; idx < declen; idx++) {
		const post = dec[idx];
		descendants[idx] = signalizePost(post, key);
	}

	return {
		post: signalizePost(thread.post),
		ancestors,
		descendants,
	};
};

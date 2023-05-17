// we keep a global cache outside of tanstack-query because these records can be
// returned in multiple places, e.g. you open a post and then one of its replies

// in that one example, we can feed some initial data to tanstack-query so you
// can at least see the reply and its parents while the app tries to get the
// replies for that one

// this is a form of normalized caching

import { type Signal, signal } from '~/utils/signals.ts';

import { type BskyPost, type BskyPostAuthor } from './types.ts';

export const postAuthors: Record<string, WeakRef<Signal<BskyPostAuthor>>> = {};
export const posts: Record<string, WeakRef<Signal<BskyPost>>> = {};
export const signalizePost = (post: BskyPost, key?: number | null) => {
	const disabled = key === null;

	let ref: WeakRef<Signal<BskyPost>> | undefined = posts[post.cid];
	let signalized: Signal<BskyPost>;

	if (disabled || !ref || !(signalized = ref.deref()!)) {
		signalized = signal(post);

		if (!disabled) {
			posts[post.cid] = new WeakRef(signalized);
		}
	}
	else if (signalized) {
		// Prevent further updates if if the post currently contains that key
		if (!key || signalized.peek().$key !== key) {
			signalized.value = post;
		}
	}

	return signalized;
};

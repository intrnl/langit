// we keep a global cache outside of tanstack-query because these records can be
// returned in multiple places, e.g. you open a post and then one of its replies

// in that one example, we can feed some initial data to tanstack-query so you
// can at least see the reply and its parents while the app tries to get the
// replies for that one

// this is a form of normalized caching

import { type Signal, signal } from '~/utils/signals.ts';

import {
	type BskyPost,
	type BskyProfileBasic,
	type LinearizedThread,
	type SignalizedLinearThread,
} from './types.ts';

type Kignal<T> = Signal<T> & { _key?: number };

export const profilesBasic: Record<string, WeakRef<Kignal<BskyProfileBasic>>> = {};
export const posts: Record<string, WeakRef<Kignal<BskyPost>>> = {};

export const signalizeProfileBasic = (profile: BskyProfileBasic, key?: number) => {
	let did = profile.did;

	let ref: WeakRef<Kignal<BskyProfileBasic>> | undefined = profilesBasic[profile.did];
	let signalized: Kignal<BskyProfileBasic>;

	if (!ref || !(signalized = ref.deref()!)) {
		signalized = signal(profile);
		profilesBasic[did] = new WeakRef(signalized);
	}
	else if (signalized) {
		if (!key || signalized._key !== key) {
			signalized.value = profile;
		}
	}

	return signalized;
};

const patchPost = (post: BskyPost, key?: number) => {
	let profile = signalizeProfileBasic(post.author, key);

	Object.defineProperty(post, 'author', {
		get () {
			return profile.value;
		},
	});
};

export const signalizePost = (post: BskyPost, key?: number) => {
	let cid = post.cid;

	let ref: WeakRef<Kignal<BskyPost>> | undefined = posts[cid];
	let signalized: Kignal<BskyPost>;

	if (!ref || !(signalized = ref.deref()!)) {
		patchPost(post, key);

		signalized = signal(post);
		posts[cid] = new WeakRef(signalized);
	}
	else if (signalized) {
		// Prevent further updates if if the post currently contains that key
		if (!key || signalized._key !== key) {
			patchPost(post, key);
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
		parentNotFound: thread.parentNotFound,
		ancestors,
		descendants,
	};
};

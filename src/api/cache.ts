// we keep a normalized cache outside of tanstack-query because these resources
// can be mutated or refreshed by many endpoints

// for example:
// from timeline, opening a thread and liking it should reflect back into the
// timeline, without needing the timeline itself to actually refresh.

import {
	type BskyPost,
	type BskyProfile,
	type BskyProfileBasic,
	type BskyTimelinePost,
	type LinearizedThread,
} from './types.ts';

import { type Signal, signal } from '~/utils/signals.ts';

type Ref<T extends object> = WeakRef<T>;

export const posts: Record<string, Ref<SignalizedPost>> = {};
export const profiles: Record<string, Ref<SignalizedProfile>> = {};
export const profilesBasic: Record<string, Ref<SignalizedProfileBasic>> = {};

const update = <T>(ref: Signal<T>, value: T): Signal<T> => {
	ref.value = value;
	return ref;
};

/** @see BskyProfileBasic */
export interface SignalizedProfileBasic {
	_key?: number;
	did: BskyProfileBasic['did'];
	handle: Signal<BskyProfileBasic['handle']>;
	displayName: Signal<BskyProfileBasic['displayName']>;
	avatar: Signal<BskyProfileBasic['avatar']>;
	labels: Signal<BskyProfileBasic['labels']>;
	viewer: {
		muted: Signal<BskyProfileBasic['viewer']['muted']>;
		blockedBy: Signal<BskyProfileBasic['viewer']['blockedBy']>;
		following: Signal<BskyProfileBasic['viewer']['following']>;
	};
}

// create SignalizedProfileBasic by sharing the same signals as SignalizedProfile
const createSignalizedProfileBasicFromProfile = (
	basic: BskyProfileBasic,
	key?: number,
): SignalizedProfileBasic | undefined => {
	const did = basic.did;

	const ref = profiles[did];
	const full = ref && ref.deref();

	if (full) {
		return {
			_key: key,
			did: did,
			handle: update(full.handle, basic.handle),
			displayName: update(full.displayName, basic.displayName),
			avatar: update(full.avatar, basic.avatar),
			labels: update(full.labels, basic.labels),
			viewer: {
				muted: update(full.viewer.muted, basic.viewer.muted),
				blockedBy: update(full.viewer.blockedBy, basic.viewer.blockedBy),
				following: update(full.viewer.following, basic.viewer.following),
			},
		};
	}
};

const createSignalizedProfileBasic = (profile: BskyProfileBasic, key?: number): SignalizedProfileBasic => {
	const conversion = createSignalizedProfileBasicFromProfile(profile, key);

	if (conversion) {
		return conversion;
	}

	return {
		_key: key,
		did: profile.did,
		handle: signal(profile.handle),
		displayName: signal(profile.displayName),
		avatar: signal(profile.avatar),
		labels: signal(profile.labels),
		viewer: {
			muted: signal(profile.viewer.muted),
			blockedBy: signal(profile.viewer.blockedBy),
			following: signal(profile.viewer.following),
		},
	};
};

export const mergeSignalizedProfileBasic = (profile: BskyProfileBasic, key?: number) => {
	let did = profile.did;

	let ref: Ref<SignalizedProfileBasic> | undefined = profilesBasic[did];
	let val: SignalizedProfileBasic;

	if (!ref || !(val = ref.deref()!)) {
		val = createSignalizedProfileBasic(profile, key);
		profilesBasic[did] = new WeakRef(val);
	}
	else if (!key || val._key !== key) {
		val._key = key;

		val.handle.value = profile.handle;
		val.displayName.value = profile.displayName;
		val.avatar.value = profile.avatar;
		val.labels.value = profile.labels;

		val.viewer.muted.value = profile.viewer.muted;
		val.viewer.blockedBy.value = profile.viewer.blockedBy;
		val.viewer.following.value = profile.viewer.following;
	}

	return val;
};

/** @see BskyProfile */
export interface SignalizedProfile {
	_key?: number;
	did: string;
	handle: Signal<BskyProfile['handle']>;
	displayName: Signal<BskyProfile['displayName']>;
	description: Signal<BskyProfile['description']>;
	avatar: Signal<BskyProfile['avatar']>;
	banner: Signal<BskyProfile['banner']>;
	followersCount: Signal<BskyProfile['followersCount']>;
	followsCount: Signal<BskyProfile['followsCount']>;
	postsCount: Signal<BskyProfile['postsCount']>;
	indexedAt: Signal<BskyProfile['indexedAt']>;
	labels: Signal<BskyProfile['labels']>;
	viewer: {
		muted: Signal<BskyProfile['viewer']['muted']>;
		blockedBy: Signal<BskyProfile['viewer']['blockedBy']>;
		following: Signal<BskyProfile['viewer']['following']>;
	};
}

// create SignalizedProfile by sharing the same signals as SignalizedProfileBasic
const createSignalizedProfileFromProfileBasic = (full: BskyProfile, key?: number): SignalizedProfile | undefined => {
	const did = full.did;

	const ref = profilesBasic[did];
	const basic = ref && ref.deref();

	if (basic) {
		return {
			_key: key,
			did: did,
			handle: update(basic.handle, full.handle),
			displayName: update(basic.displayName, full.displayName),
			description: signal(full.description),
			avatar: update(basic.avatar, full.avatar),
			banner: signal(full.banner),
			followersCount: signal(full.followersCount),
			followsCount: signal(full.followsCount),
			postsCount: signal(full.postsCount),
			indexedAt: signal(full.indexedAt),
			labels: update(basic.labels, full.labels),
			viewer: {
				muted: update(basic.viewer.muted, full.viewer.muted),
				blockedBy: update(basic.viewer.blockedBy, full.viewer.blockedBy),
				following: update(basic.viewer.following, full.viewer.following),
			},
		};
	}
};

const createSignalizedProfile = (profile: BskyProfile, key?: number): SignalizedProfile => {
	const conversion = createSignalizedProfileFromProfileBasic(profile, key);

	if (conversion) {
		return conversion;
	}

	return {
		_key: key,
		did: profile.did,
		handle: signal(profile.handle),
		displayName: signal(profile.displayName),
		description: signal(profile.description),
		avatar: signal(profile.avatar),
		banner: signal(profile.banner),
		followersCount: signal(profile.followersCount),
		followsCount: signal(profile.followsCount),
		postsCount: signal(profile.postsCount),
		indexedAt: signal(profile.indexedAt),
		labels: signal(profile.labels),
		viewer: {
			muted: signal(profile.viewer.muted),
			blockedBy: signal(profile.viewer.blockedBy),
			following: signal(profile.viewer.following),
		},
	};
};

export const mergeSignalizedProfile = (profile: BskyProfile, key?: number) => {
	let did = profile.did;

	let ref: Ref<SignalizedProfile> | undefined = profiles[did];
	let val: SignalizedProfile;

	if (!ref || !(val = ref.deref()!)) {
		val = createSignalizedProfile(profile, key);
		profiles[did] = new WeakRef(val);
	}
	else if (!key || val._key !== key) {
		val._key = key;

		val.handle.value = profile.handle;
		val.displayName.value = profile.displayName;
		val.description.value = profile.description;
		val.avatar.value = profile.avatar;
		val.banner.value = profile.banner;
		val.followersCount.value = profile.followersCount;
		val.followsCount.value = profile.followsCount;
		val.postsCount.value = profile.postsCount;
		val.indexedAt.value = profile.indexedAt;
		val.labels.value = profile.labels;

		val.viewer.muted.value = profile.viewer.muted;
		val.viewer.blockedBy.value = profile.viewer.blockedBy;
		val.viewer.following.value = profile.viewer.following;
	}

	return val;
};

/** @see BskyPost */
export interface SignalizedPost {
	_key?: number;
	uri: BskyPost['uri'];
	cid: BskyPost['cid'];
	author: SignalizedProfileBasic;
	record: Signal<BskyPost['record']>;
	embed: Signal<BskyPost['embed']>;
	replyCount: Signal<BskyPost['replyCount']>;
	repostCount: Signal<BskyPost['repostCount']>;
	likeCount: Signal<BskyPost['likeCount']>;
	indexedAt: Signal<BskyPost['indexedAt']>;
	labels: Signal<BskyPost['labels']>;
	viewer: {
		like: Signal<BskyPost['viewer']['like']>;
		repost: Signal<BskyPost['viewer']['repost']>;
	};
}

const createSignalizedPost = (post: BskyPost, key?: number): SignalizedPost => {
	return {
		_key: key,
		uri: post.uri,
		cid: post.cid,
		author: mergeSignalizedProfileBasic(post.author, key),
		record: signal(post.record),
		embed: signal(post.embed),
		replyCount: signal(post.replyCount),
		repostCount: signal(post.repostCount),
		likeCount: signal(post.likeCount),
		indexedAt: signal(post.indexedAt),
		labels: signal(post.labels),
		viewer: {
			like: signal(post.viewer.like),
			repost: signal(post.viewer.repost),
		},
	};
};

export const mergeSignalizedPost = (post: BskyPost, key?: number) => {
	let cid = post.cid;

	let ref: Ref<SignalizedPost> | undefined = posts[cid];
	let val: SignalizedPost;

	if (!ref || !(val = ref.deref()!)) {
		val = createSignalizedPost(post, key);
		posts[cid] = new WeakRef(val);
	}
	else if (!key || val._key !== key) {
		val._key = key;

		val.author = mergeSignalizedProfileBasic(post.author, key);

		val.record.value = post.record;
		val.embed.value = post.embed;
		val.replyCount.value = post.replyCount;
		val.repostCount.value = post.repostCount;
		val.likeCount.value = post.likeCount;
		val.indexedAt.value = post.indexedAt;
		val.labels.value = post.labels;

		val.viewer.like.value = post.viewer.like;
		val.viewer.repost.value = post.viewer.repost;
	}

	return val;
};

/** @see BskyTimelinePost */
export interface SignalizedTimelinePost {
	post: SignalizedPost;
	reply?: {
		root: SignalizedPost;
		parent: SignalizedPost;
	};
	reason: BskyTimelinePost['reason'];
}

export const createSignalizedTimelinePost = (item: BskyTimelinePost, key?: number): SignalizedTimelinePost => {
	const reply = item.reply;

	return {
		post: mergeSignalizedPost(item.post, key),
		reply: reply && {
			root: mergeSignalizedPost(reply.root, key),
			parent: mergeSignalizedPost(reply.parent, key),
		},
		reason: item.reason,
	};
};

/** @see LinearizedThread */
export interface SignalizedLinearThread {
	post: SignalizedPost;
	parentNotFound: boolean;
	ancestors: SignalizedPost[];
	descendants: SignalizedPost[];
}

export const createSignalizedLinearThread = (thread: LinearizedThread, key?: number): SignalizedLinearThread => {
	const anc = thread.ancestors;
	const dec = thread.descendants;

	const anclen = anc.length;
	const declen = dec.length;

	const ancestors: SignalizedPost[] = new Array(anclen);
	const descendants: SignalizedPost[] = new Array(declen);

	for (let idx = 0; idx < anclen; idx++) {
		const post = anc[idx];
		ancestors[idx] = mergeSignalizedPost(post, key);
	}

	for (let idx = 0; idx < declen; idx++) {
		const post = dec[idx];
		descendants[idx] = mergeSignalizedPost(post, key);
	}

	return {
		post: mergeSignalizedPost(thread.post),
		parentNotFound: thread.parentNotFound,
		ancestors,
		descendants,
	};
};

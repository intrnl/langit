// we keep a normalized cache outside of tanstack-query because these resources
// can be mutated or refreshed by many endpoints

// for example:
// from timeline, opening a thread and liking it should reflect back into the
// timeline, without needing the timeline itself to actually refresh.

import { dequal } from 'dequal/lite';

import { detectFacets } from './richtext/detection.ts';
import { segmentRichText } from './richtext/segmentize.ts';
import { RichTextSegment } from './richtext/types.ts';
import { UnicodeString } from './richtext/unicode.ts';

import {
	type BskyPost,
	type BskyProfile,
	type BskyProfileBasic,
	type BskyProfileFollow,
	type BskyTimelinePost,
	type LinearizedThread,
} from './types.ts';

import { type Signal, signal } from '~/utils/signals.ts';

type Ref<T extends object> = WeakRef<T>;

export const posts: Record<string, Ref<SignalizedPost>> = {};
export const profiles: Record<string, Ref<SignalizedProfile>> = {};

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

	$renderedDescription: ReturnType<typeof createProfileDescriptionRenderer>;
}

const createSignalizedProfile = (
	profile: BskyProfile | BskyProfileBasic | BskyProfileFollow,
	key?: number,
): SignalizedProfile => {
	const isProfileFollow = 'description' in profile;
	const isProfile = 'postsCount' in profile;

	return {
		_key: key,
		did: profile.did,
		handle: signal(profile.handle),
		displayName: signal(profile.displayName),
		description: signal(isProfileFollow ? profile.description : ''),
		avatar: signal(profile.avatar),
		banner: signal(isProfile ? profile.banner : ''),
		followersCount: signal(isProfile ? profile.followersCount : 0),
		followsCount: signal(isProfile ? profile.followsCount : 0),
		postsCount: signal(isProfile ? profile.postsCount : 0),
		indexedAt: signal(isProfileFollow ? profile.indexedAt : ''),
		labels: signal(profile.labels),
		viewer: {
			muted: signal(profile.viewer.muted),
			blockedBy: signal(profile.viewer.blockedBy),
			following: signal(profile.viewer.following),
		},
		$renderedDescription: createProfileDescriptionRenderer(),
	};
};

export const mergeSignalizedProfile = (profile: BskyProfile | BskyProfileBasic | BskyProfileFollow, key?: number) => {
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
		val.avatar.value = profile.avatar;
		val.labels.value = profile.labels;

		val.viewer.muted.value = profile.viewer.muted;
		val.viewer.blockedBy.value = profile.viewer.blockedBy;
		val.viewer.following.value = profile.viewer.following;

		if ('description' in profile) {
			val.description.value = profile.description;
			val.indexedAt.value = profile.indexedAt;
		}

		if ('postsCount' in profile) {
			val.banner.value = profile.banner;
			val.followersCount.value = profile.followersCount;
			val.followsCount.value = profile.followsCount;
			val.postsCount.value = profile.postsCount;
		}
	}

	return val;
};

/** @see BskyPost */
export interface SignalizedPost {
	_key?: number;
	uri: BskyPost['uri'];
	cid: BskyPost['cid'];
	author: SignalizedProfile;
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

	$renderedContent: ReturnType<typeof createPostRenderer>;
}

const createSignalizedPost = (post: BskyPost, key?: number): SignalizedPost => {
	return {
		_key: key,
		uri: post.uri,
		cid: post.cid,
		author: mergeSignalizedProfile(post.author, key),
		record: signal(post.record, { equals: dequal }),
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
		$renderedContent: createPostRenderer(),
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

		val.author = mergeSignalizedProfile(post.author, key);

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

// Miscellaneous
const TRIM_HOST_RE = /^www\./;

const toShortUrl = (uri: string): string => {
	try {
		const url = new URL(uri);

		const host = url.host.replace(TRIM_HOST_RE, '');
		const short = host + (url.pathname === '/' ? '' : url.pathname) + url.search + url.hash;

		if (short.length > 30) {
			return short.slice(0, 27) + '...';
		}

		return short;
	}
	catch (e) {
		return uri;
	}
};

const createPostRenderer = () => {
	let record: BskyPost['record'] | undefined;
	let cuid: string | undefined;

	let template: HTMLElement | undefined;

	return function (this: SignalizedPost, uid: string) {
		const curr = this.record.value;

		if (!record || record !== curr) {
			record = curr;
			cuid = uid;

			if (record.facets) {
				const segments = segmentRichText({ text: record.text, facets: record.facets });
				const div = createRenderedRichText(uid, segments);

				template = div;
			}
			else {
				template = undefined;
			}
		}

		if (template) {
			if (cuid !== uid) {
				alterRenderedRichTextUid(template, uid);
				cuid = uid;
			}

			return template.cloneNode(true);
		}
		else {
			return record.text;
		}
	};
};

const createProfileDescriptionRenderer = () => {
	let description: string;
	let cuid: string;

	let template: HTMLElement | undefined;

	return function (this: SignalizedProfile, uid: string) {
		const curr = this.description.value;

		if (description === undefined || description !== curr) {
			const text = new UnicodeString(curr);
			const facets = detectFacets(text);

			description = curr;
			cuid = uid;

			if (facets) {
				const segments = segmentRichText({ text: curr, facets: facets });
				const div = createRenderedRichText(uid, segments);

				template = div;
			}
			else {
				template = undefined;
			}
		}

		if (template) {
			if (cuid !== uid) {
				alterRenderedRichTextUid(template, uid);
				cuid = uid;
			}

			return template.cloneNode(true);
		}
		else {
			return description;
		}
	};
};

const createRenderedRichText = (uid: string, segments: RichTextSegment[]) => {
	const div = document.createElement('div');

	for (let idx = 0, len = segments.length; idx < len; idx++) {
		const segment = segments[idx];

		const mention = segment.mention;
		const link = segment.link;

		if (mention) {
			const did = mention.did;
			const anchor = document.createElement('a');

			anchor.href = `/u/${uid}/profile/${did}`;
			anchor.className = 'text-accent hover:underline';
			anchor.textContent = segment.text;
			anchor.toggleAttribute('link', true);
			anchor.setAttribute('data-mention', did);

			div.appendChild(anchor);
		}
		else if (link) {
			const uri = link.uri;
			const anchor = document.createElement('a');

			anchor.rel = 'noopener noreferrer nofollow';
			anchor.target = '_blank';
			anchor.href = uri;
			anchor.className = 'text-accent hover:underline';
			anchor.textContent = toShortUrl(uri);

			div.appendChild(anchor);
		}
		else {
			div.appendChild(document.createTextNode(segment.text));
		}
	}

	return div;
};

const alterRenderedRichTextUid = (template: HTMLElement, uid: string) => {
	const mentions = template.querySelectorAll<HTMLAnchorElement>('a[data-mention]');

	for (let idx = 0, len = mentions.length; idx < len; idx++) {
		const node = mentions[idx];
		const did = node.getAttribute('data-mention')!;

		node.href = `/u/${uid}/profile/${did}`;
	}
};

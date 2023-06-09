import { alterRenderedRichTextUid, createRenderedRichText } from '../richtext/renderer.ts';
import { segmentRichText } from '../richtext/segmentize.ts';
import { type BskyPost, type BskyTimelinePost } from '../types.ts';

import { type SignalizedProfile, mergeSignalizedProfile } from './profiles.ts';

import { type Signal, signal } from '~/utils/signals.ts';

export const posts: Record<string, WeakRef<SignalizedPost>> = {};

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

	$deleted: Signal<boolean>;
	$renderedContent: ReturnType<typeof createPostRenderer>;
}

const createSignalizedPost = (post: BskyPost, key?: number): SignalizedPost => {
	return {
		_key: key,
		uri: post.uri,
		cid: post.cid,
		author: mergeSignalizedProfile(post.author, key),
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
		$deleted: signal(false),
		$renderedContent: createPostRenderer(),
	};
};

export const mergeSignalizedPost = (post: BskyPost, key?: number) => {
	let uri = post.uri;

	let ref: WeakRef<SignalizedPost> | undefined = posts[uri];
	let val: SignalizedPost;

	if (!ref || !(val = ref.deref()!)) {
		val = createSignalizedPost(post, key);
		posts[uri] = new WeakRef(val);
	} else if (!key || val._key !== key) {
		val._key = key;

		val.author = mergeSignalizedProfile(post.author, key);

		// val.record.value = post.record;
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

export const createSignalizedTimelinePost = (
	item: BskyTimelinePost,
	key?: number,
): SignalizedTimelinePost => {
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
			} else {
				template = undefined;
			}
		}

		if (template) {
			if (cuid !== uid) {
				alterRenderedRichTextUid(template, uid);
				cuid = uid;
			}

			return template.cloneNode(true);
		} else {
			return record.text;
		}
	};
};

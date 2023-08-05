import type { DID, Records, RefOf } from '@intrnl/bluesky-client/atp-schema';

import { alterRenderedRichTextUid, createRenderedRichText } from '../richtext/renderer.ts';
import { segmentRichText } from '../richtext/segmentize.ts';

import { type SignalizedProfile, mergeSignalizedProfile } from './profiles.ts';

import { EQUALS_DEQUAL } from '~/utils/misc.ts';
import { type Signal, signal } from '~/utils/signals.ts';

type Post = RefOf<'app.bsky.feed.defs#postView'>;
type FeedPost = RefOf<'app.bsky.feed.defs#feedViewPost'>;

type PostRecord = Records['app.bsky.feed.post'];

export const posts: Record<string, WeakRef<SignalizedPost>> = {};

/** @see BskyPost */
export interface SignalizedPost {
	_key?: number;
	uri: Post['uri'];
	cid: Signal<Post['cid']>;
	author: SignalizedProfile;
	record: Signal<PostRecord>;
	embed: Signal<Post['embed']>;
	replyCount: Signal<NonNullable<Post['replyCount']>>;
	repostCount: Signal<NonNullable<Post['repostCount']>>;
	likeCount: Signal<NonNullable<Post['likeCount']>>;
	labels: Signal<Post['labels']>;
	viewer: {
		like: Signal<NonNullable<Post['viewer']>['like']>;
		repost: Signal<NonNullable<Post['viewer']>['repost']>;
	};

	$deleted: Signal<boolean>;
	$renderedContent: ReturnType<typeof createPostRenderer>;
}

const createSignalizedPost = (uid: DID, post: Post, key?: number): SignalizedPost => {
	return {
		_key: key,
		uri: post.uri,
		cid: signal(post.cid),
		author: mergeSignalizedProfile(uid, post.author, key),
		record: signal(post.record as PostRecord),
		embed: signal(post.embed, EQUALS_DEQUAL),
		replyCount: signal(post.replyCount ?? 0),
		repostCount: signal(post.repostCount ?? 0),
		likeCount: signal(post.likeCount ?? 0),
		labels: signal(post.labels, EQUALS_DEQUAL),
		viewer: {
			like: signal(post.viewer?.like),
			repost: signal(post.viewer?.repost),
		},
		$deleted: signal(false),
		$renderedContent: createPostRenderer(),
	};
};

export const mergeSignalizedPost = (uid: DID, post: Post, key?: number) => {
	let id = uid + '|' + post.uri;

	let ref: WeakRef<SignalizedPost> | undefined = posts[id];
	let val: SignalizedPost;

	if (!ref || !(val = ref.deref()!)) {
		val = createSignalizedPost(uid, post, key);
		posts[id] = new WeakRef(val);
	} else if (!key || val._key !== key) {
		val._key = key;

		val.cid.value = post.cid;
		val.author = mergeSignalizedProfile(uid, post.author, key);

		val.record.value = post.record as PostRecord;
		val.embed.value = post.embed;
		val.replyCount.value = post.replyCount ?? 0;
		val.repostCount.value = post.repostCount ?? 0;
		val.likeCount.value = post.likeCount ?? 0;
		val.labels.value = post.labels;

		val.viewer.like.value = post.viewer?.like;
		val.viewer.repost.value = post.viewer?.repost;
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
	reason: FeedPost['reason'];
}

export const createSignalizedTimelinePost = (
	uid: DID,
	item: FeedPost,
	key?: number,
): SignalizedTimelinePost => {
	const reply = item.reply;

	return {
		post: mergeSignalizedPost(uid, item.post, key),
		reply: reply && {
			root: mergeSignalizedPost(uid, reply.root as Post, key),
			parent: mergeSignalizedPost(uid, reply.parent as Post, key),
		},
		reason: item.reason,
	};
};

const createPostRenderer = () => {
	let record: PostRecord | undefined;
	let cuid: string | undefined;

	let template: HTMLElement | undefined;

	return function (this: SignalizedPost, uid: string) {
		const curr = this.record.value as PostRecord;

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

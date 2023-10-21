import { createRoot, type Accessor } from 'solid-js';

import type { DID, Records, RefOf } from '@intrnl/bluesky-client/atp-schema';

import {
	type ModerationCause,
	type ModerationDecision,
	decideLabelModeration,
	decideMutedKeywordModeration,
	decideMutedPermanentModeration,
	decideMutedTemporaryModeration,
	finalizeModeration,
} from '../moderation/action.ts';
import { PreferenceWarn } from '../moderation/enums.ts';
import { createRenderedRichText, handleInvalidLinkClick } from '../richtext/renderer.ts';
import { segmentRichText } from '../richtext/segmentize.ts';

import { type SignalizedProfile, mergeSignalizedProfile } from './profiles.ts';

import { getAccountModerationOpts, isProfileTemporarilyMuted } from '~/globals/settings.ts';
import { createLazyMemo } from '~/utils/hooks.ts';
import { EQUALS_DEQUAL } from '~/utils/misc.ts';
import { type Signal, signal } from '~/utils/signals.ts';

type Post = RefOf<'app.bsky.feed.defs#postView'>;
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
	/** Post on timeline needs to be truncated, `undefined` if not sure. */
	$truncated: boolean | undefined;

	$renderedContent: ReturnType<typeof createPostRenderer>;
	$mod: ReturnType<typeof createPostModerationDecision>;
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
		$truncated: undefined,

		$renderedContent: createPostRenderer(uid),
		$mod: createPostModerationDecision(uid),
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
		mergeSignalizedProfile(uid, post.author, key);

		// val.record.value = post.record as PostRecord;
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

export const createPostModerationDecision = (uid: DID) => {
	let accessor: Accessor<ModerationDecision | null>;

	return function (this: SignalizedPost) {
		if (!accessor) {
			const opts = getAccountModerationOpts(uid);

			const labels = this.labels;
			const record = this.record;
			const muted = this.author.viewer.muted;
			const authorDid = this.author.did;

			accessor = createRoot(() => {
				return createLazyMemo(() => {
					const accu: ModerationCause[] = [];

					decideLabelModeration(accu, labels.value, authorDid, opts);
					decideMutedPermanentModeration(accu, muted.value);
					decideMutedTemporaryModeration(accu, isProfileTemporarilyMuted(uid, authorDid));
					decideMutedKeywordModeration(accu, record.value.text, PreferenceWarn, opts);

					return finalizeModeration(accu);
				});
			});
		}

		return accessor();
	};
};

const createPostRenderer = (uid: DID) => {
	let record: PostRecord | undefined;
	let template: HTMLElement | undefined;

	return function (this: SignalizedPost) {
		const curr = this.record.value as PostRecord;

		if (!record || record !== curr) {
			record = curr;

			if (record.facets) {
				const segments = segmentRichText({ text: record.text, facets: record.facets });
				const div = createRenderedRichText(uid, segments);

				template = div;
			} else {
				template = undefined;
			}
		}

		if (template) {
			const cloned = template.cloneNode(true);
			cloned.addEventListener('click', handleInvalidLinkClick);

			return cloned;
		} else {
			return record.text;
		}
	};
};

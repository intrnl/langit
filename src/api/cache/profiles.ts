import type { RefOf } from '@intrnl/bluesky-client/atp-schema';

import { detectFacets } from '../richtext/detection.ts';
import { alterRenderedRichTextUid, createRenderedRichText } from '../richtext/renderer.ts';
import { segmentRichText } from '../richtext/segmentize.ts';
import { UnicodeString } from '../richtext/unicode.ts';

import { type Signal, signal } from '~/utils/signals.ts';

type Profile = RefOf<'app.bsky.actor.defs#profileView'>;
type ProfileBasic = RefOf<'app.bsky.actor.defs#profileViewBasic'>;
type ProfileDetailed = RefOf<'app.bsky.actor.defs#profileViewDetailed'>;

export const profiles: Record<string, WeakRef<SignalizedProfile>> = {};

/** @see BskyProfile */
export interface SignalizedProfile {
	_key?: number;
	did: ProfileDetailed['did'];
	handle: Signal<ProfileDetailed['handle']>;
	displayName: Signal<ProfileDetailed['displayName']>;
	description: Signal<ProfileDetailed['description']>;
	avatar: Signal<ProfileDetailed['avatar']>;
	banner: Signal<ProfileDetailed['banner']>;
	followersCount: Signal<NonNullable<ProfileDetailed['followersCount']>>;
	followsCount: Signal<NonNullable<ProfileDetailed['followsCount']>>;
	postsCount: Signal<NonNullable<ProfileDetailed['postsCount']>>;
	labels: Signal<ProfileDetailed['labels']>;
	viewer: {
		muted: Signal<NonNullable<ProfileDetailed['viewer']>['muted']>;
		mutedByList: Signal<NonNullable<ProfileDetailed['viewer']>['mutedByList']>;
		blockedBy: Signal<NonNullable<ProfileDetailed['viewer']>['blockedBy']>;
		blocking: Signal<NonNullable<ProfileDetailed['viewer']>['blocking']>;
		following: Signal<NonNullable<ProfileDetailed['viewer']>['following']>;
		followedBy: Signal<NonNullable<ProfileDetailed['viewer']>['followedBy']>;
	};

	$renderedDescription: ReturnType<typeof createProfileDescriptionRenderer>;
}

const createSignalizedProfile = (
	profile: Profile | ProfileBasic | ProfileDetailed,
	key?: number,
): SignalizedProfile => {
	const isProfile = 'description' in profile;
	const isDetailed = 'postsCount' in profile;

	return {
		_key: key,
		did: profile.did,
		handle: signal(profile.handle),
		displayName: signal(profile.displayName),
		description: signal(isProfile ? profile.description : ''),
		avatar: signal(profile.avatar),
		banner: signal(isDetailed ? profile.banner : ''),
		followersCount: signal((isDetailed && profile.followersCount) || 0),
		followsCount: signal((isDetailed && profile.followsCount) || 0),
		postsCount: signal((isDetailed && profile.postsCount) || 0),
		labels: signal(profile.labels),
		viewer: {
			muted: signal(profile.viewer?.muted),
			mutedByList: signal(profile.viewer?.mutedByList),
			blockedBy: signal(profile.viewer?.blockedBy),
			blocking: signal(profile.viewer?.blocking),
			following: signal(profile.viewer?.following),
			followedBy: signal(profile.viewer?.followedBy),
		},

		$renderedDescription: createProfileDescriptionRenderer(),
	};
};

export const mergeSignalizedProfile = (profile: Profile | ProfileBasic | ProfileDetailed, key?: number) => {
	let did = profile.did;

	let ref: WeakRef<SignalizedProfile> | undefined = profiles[did];
	let val: SignalizedProfile;

	if (!ref || !(val = ref.deref()!)) {
		val = createSignalizedProfile(profile, key);
		profiles[did] = new WeakRef(val);
	} else if (!key || val._key !== key) {
		val._key = key;

		val.handle.value = profile.handle;
		val.displayName.value = profile.displayName;
		val.avatar.value = profile.avatar;
		val.labels.value = profile.labels;

		val.viewer.muted.value = profile.viewer?.muted;
		val.viewer.mutedByList.value = profile.viewer?.mutedByList;
		val.viewer.blocking.value = profile.viewer?.blocking;
		val.viewer.blockedBy.value = profile.viewer?.blockedBy;
		val.viewer.following.value = profile.viewer?.following;
		val.viewer.followedBy.value = profile.viewer?.followedBy;

		if ('description' in profile) {
			val.description.value = profile.description;
		}

		if ('postsCount' in profile) {
			val.banner.value = profile.banner;
			val.followersCount.value = profile.followersCount ?? 0;
			val.followsCount.value = profile.followsCount ?? 0;
			val.postsCount.value = profile.postsCount ?? 0;
		}
	}

	return val;
};

const createProfileDescriptionRenderer = () => {
	let description: string;
	let cuid: string;

	let template: HTMLElement | undefined;

	return function (this: SignalizedProfile, uid: string) {
		const curr = this.description.value;

		if (curr === undefined) {
			template = undefined;
		} else if (description === undefined || description !== curr) {
			const text = new UnicodeString(curr);
			const facets = detectFacets(text);

			description = curr;
			cuid = uid;

			if (facets) {
				const segments = segmentRichText({ text: curr, facets: facets });
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
			return description;
		}
	};
};

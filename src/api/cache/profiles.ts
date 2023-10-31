import type { DID, RefOf } from '@externdefs/bluesky-client/atp-schema';

import { sanitizeDisplayName } from '../display.ts';

import { detectFacets } from '../richtext/detection.ts';
import { createRenderedRichText, handleInvalidLinkClick } from '../richtext/renderer.ts';
import { segmentRichText } from '../richtext/segmentize.ts';
import { UnicodeString } from '../richtext/unicode.ts';

import { EQUALS_DEQUAL } from '~/utils/misc.ts';
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
	uid: DID,
	profile: Profile | ProfileBasic | ProfileDetailed,
	key?: number,
): SignalizedProfile => {
	const isProfile = 'description' in profile;
	const isDetailed = 'postsCount' in profile;

	return {
		_key: key,
		did: profile.did,
		handle: signal(profile.handle),
		displayName: signal(sanitizeDisplayName(profile.displayName)),
		description: signal(isProfile ? profile.description : ''),
		avatar: signal(profile.avatar),
		banner: signal(isDetailed ? profile.banner : ''),
		followersCount: signal((isDetailed && profile.followersCount) || 0),
		followsCount: signal((isDetailed && profile.followsCount) || 0),
		postsCount: signal((isDetailed && profile.postsCount) || 0),
		labels: signal(profile.labels, EQUALS_DEQUAL),
		viewer: {
			muted: signal(profile.viewer?.muted),
			mutedByList: signal(profile.viewer?.mutedByList),
			blockedBy: signal(profile.viewer?.blockedBy),
			blocking: signal(profile.viewer?.blocking),
			following: signal(profile.viewer?.following),
			followedBy: signal(profile.viewer?.followedBy),
		},

		$renderedDescription: createProfileDescriptionRenderer(uid),
	};
};

export const mergeSignalizedProfile = (
	uid: DID,
	profile: Profile | ProfileBasic | ProfileDetailed,
	key?: number,
) => {
	let id = uid + '|' + profile.did;

	let ref: WeakRef<SignalizedProfile> | undefined = profiles[id];
	let val: SignalizedProfile;

	if (!ref || !(val = ref.deref()!)) {
		val = createSignalizedProfile(uid, profile, key);
		profiles[id] = new WeakRef(val);
	} else if (!key || val._key !== key) {
		val._key = key;

		val.handle.value = profile.handle;
		val.displayName.value = sanitizeDisplayName(profile.displayName);
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

const createProfileDescriptionRenderer = (uid: DID) => {
	let description: string;
	let template: HTMLElement | undefined;

	return function (this: SignalizedProfile) {
		const curr = this.description.value;

		if (curr === undefined) {
			template = undefined;
		} else if (description === undefined || description !== curr) {
			const text = new UnicodeString(curr);
			const facets = detectFacets(text);

			description = curr;

			if (facets) {
				const segments = segmentRichText({ text: curr, facets: facets });
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
			return description;
		}
	};
};

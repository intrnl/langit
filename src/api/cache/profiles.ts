import { detectFacets } from '../richtext/detection.ts';
import { alterRenderedRichTextUid, createRenderedRichText } from '../richtext/renderer.ts';
import { segmentRichText } from '../richtext/segmentize.ts';
import { UnicodeString } from '../richtext/unicode.ts';

import { type BskyProfile, type BskyProfileBasic, type BskyProfileFollow } from '../types.ts';

import { type Signal, signal } from '~/utils/signals.ts';

export const profiles: Record<string, WeakRef<SignalizedProfile>> = {};

/** @see BskyProfile */
export interface SignalizedProfile {
	_key?: number;
	did: BskyProfile['did'];
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
		mutedByList: Signal<BskyProfile['viewer']['mutedByList']>;
		blocking: Signal<BskyProfile['viewer']['blocking']>;
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
			mutedByList: signal(profile.viewer.mutedByList),
			blocking: signal(profile.viewer.blocking),
			blockedBy: signal(profile.viewer.blockedBy),
			following: signal(profile.viewer.following),
		},
		$renderedDescription: createProfileDescriptionRenderer(),
	};
};

export const mergeSignalizedProfile = (
	profile: BskyProfile | BskyProfileBasic | BskyProfileFollow,
	key?: number,
) => {
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

		val.viewer.muted.value = profile.viewer.muted;
		val.viewer.mutedByList.value = profile.viewer.mutedByList;
		val.viewer.blocking.value = profile.viewer.blocking;
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

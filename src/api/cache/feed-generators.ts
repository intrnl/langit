import type { DID, RefOf } from '@intrnl/bluesky-client/atp-schema';

import { createRenderedRichText, handleInvalidLinkClick } from '../richtext/renderer.ts';
import { segmentRichText } from '../richtext/segmentize.ts';

import { type SignalizedProfile, mergeSignalizedProfile } from './profiles.ts';

import { type Signal, signal } from '~/utils/signals.ts';

type Facet = RefOf<'app.bsky.richtext.facet'>;
type FeedGenerator = RefOf<'app.bsky.feed.defs#generatorView'>;

export const feedGenerators: Record<string, WeakRef<SignalizedFeedGenerator>> = {};

/** @see BskyFeedGenerator */
export interface SignalizedFeedGenerator {
	_key?: number;
	uri: string;
	cid: Signal<FeedGenerator['cid']>;
	did: Signal<FeedGenerator['did']>;
	creator: SignalizedProfile;
	name: Signal<FeedGenerator['displayName']>;
	description: Signal<FeedGenerator['description']>;
	descriptionFacets: Signal<FeedGenerator['descriptionFacets']>;
	avatar: Signal<FeedGenerator['avatar']>;
	likeCount: Signal<NonNullable<FeedGenerator['likeCount']>>;
	viewer: {
		like: Signal<NonNullable<FeedGenerator['viewer']>['like']>;
	};

	$renderedDescription: ReturnType<typeof createFeedDescriptionRenderer>;
}

const createSignalizedFeedGenerator = (
	uid: DID,
	feed: FeedGenerator,
	key?: number,
): SignalizedFeedGenerator => {
	return {
		_key: key,
		uri: feed.uri,
		cid: signal(feed.cid),
		did: signal(feed.did),
		creator: mergeSignalizedProfile(uid, feed.creator, key),
		name: signal(feed.displayName),
		description: signal(feed.description),
		descriptionFacets: signal(feed.descriptionFacets),
		avatar: signal(feed.avatar),
		likeCount: signal(feed.likeCount ?? 0),
		viewer: {
			like: signal(feed.viewer?.like),
		},
		$renderedDescription: createFeedDescriptionRenderer(uid),
	};
};

export const mergeSignalizedFeedGenerator = (
	uid: DID,
	feed: FeedGenerator,
	key?: number,
): SignalizedFeedGenerator => {
	let id = uid + '|' + feed.uri;

	let ref: WeakRef<SignalizedFeedGenerator> | undefined = feedGenerators[id];
	let val: SignalizedFeedGenerator;

	if (!ref || !(val = ref.deref()!)) {
		val = createSignalizedFeedGenerator(uid, feed, key);
		feedGenerators[id] = new WeakRef(val);
	} else if (!key || val._key !== key) {
		val._key = key;

		val.cid.value = feed.cid;
		val.did.value = feed.did;

		val.creator = mergeSignalizedProfile(uid, feed.creator, key);

		val.name.value = feed.displayName;
		val.description.value = feed.description;
		val.descriptionFacets.value = feed.descriptionFacets;
		val.avatar.value = feed.avatar;
		val.likeCount.value = feed.likeCount ?? 0;

		val.viewer.like.value = feed.viewer?.like;
	}

	return val;
};

const createFeedDescriptionRenderer = (uid: DID) => {
	let _description: string;
	let _facets: Facet[] | undefined;

	let template: HTMLElement | undefined;

	return function (this: SignalizedFeedGenerator) {
		const description = this.description.value;
		const facets = this.descriptionFacets.value;

		if (_description !== description || _facets !== facets) {
			_description = description || '';
			_facets = facets;

			if (_facets) {
				const segments = segmentRichText({ text: _description, facets: _facets });
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
			return _description;
		}
	};
};

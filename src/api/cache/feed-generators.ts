import { alterRenderedRichTextUid, createRenderedRichText } from '../richtext/renderer.ts';
import { segmentRichText } from '../richtext/segmentize.ts';
import { type Facet } from '../richtext/types.ts';
import { type BskyFeedGenerator } from '../types.ts';

import { type SignalizedProfile, mergeSignalizedProfile } from './profiles.ts';

import { type Signal, signal } from '~/utils/signals.ts';

export const feedGenerators: Record<string, WeakRef<SignalizedFeedGenerator>> = {};

/** @see BskyFeedGenerator */
export interface SignalizedFeedGenerator {
	_key?: number;
	uri: string;
	cid: string;
	did: Signal<BskyFeedGenerator['did']>;
	creator: SignalizedProfile;
	displayName: Signal<BskyFeedGenerator['displayName']>;
	description: Signal<BskyFeedGenerator['description']>;
	descriptionFacets: Signal<BskyFeedGenerator['descriptionFacets']>;
	avatar: Signal<BskyFeedGenerator['avatar']>;
	likeCount: Signal<BskyFeedGenerator['likeCount']>;
	indexedAt: Signal<BskyFeedGenerator['indexedAt']>;
	viewer: {
		like: Signal<NonNullable<BskyFeedGenerator['viewer']>['like']>;
	};

	$renderedDescription: ReturnType<typeof createFeedDescriptionRenderer>;
}

const createSignalizedFeedGenerator = (feed: BskyFeedGenerator, key?: number): SignalizedFeedGenerator => {
	return {
		_key: key,
		uri: feed.uri,
		cid: feed.cid,
		did: signal(feed.did),
		creator: mergeSignalizedProfile(feed.creator, key),
		displayName: signal(feed.displayName),
		description: signal(feed.description),
		descriptionFacets: signal(feed.descriptionFacets),
		avatar: signal(feed.avatar),
		likeCount: signal(feed.likeCount),
		indexedAt: signal(feed.indexedAt),
		viewer: {
			like: signal(feed.viewer?.like),
		},
		$renderedDescription: createFeedDescriptionRenderer(),
	};
};

export const mergeSignalizedFeedGenerator = (
	feed: BskyFeedGenerator,
	key?: number,
): SignalizedFeedGenerator => {
	let uri = feed.uri;

	let ref: WeakRef<SignalizedFeedGenerator> | undefined = feedGenerators[uri];
	let val: SignalizedFeedGenerator;

	if (!ref || !(val = ref.deref()!)) {
		val = createSignalizedFeedGenerator(feed, key);
		feedGenerators[uri] = new WeakRef(val);
	} else if (!key || val._key !== key) {
		val._key = key;

		val.did.value = feed.did;

		val.creator = mergeSignalizedProfile(feed.creator, key);

		val.displayName.value = feed.displayName;
		val.description.value = feed.description;
		val.descriptionFacets.value = feed.descriptionFacets;
		val.avatar.value = feed.avatar;
		val.likeCount.value = feed.likeCount;
		val.indexedAt.value = feed.indexedAt;

		val.viewer.like.value = feed.viewer?.like;
	}

	return val;
};

const createFeedDescriptionRenderer = () => {
	let _description: string;
	let _facets: Facet[] | undefined;
	let _uid: string;

	let template: HTMLElement | undefined;

	return function (this: SignalizedFeedGenerator, uid: string) {
		const description = this.description.value;
		const facets = this.descriptionFacets.value;

		if (_description !== description || _facets !== facets) {
			_description = description || '';
			_facets = facets;
			_uid = uid;

			if (_facets) {
				const segments = segmentRichText({ text: _description, facets: _facets });
				const div = createRenderedRichText(uid, segments);

				template = div;
			} else {
				template = undefined;
			}
		}

		if (template) {
			if (_uid !== uid) {
				_uid = uid;
				alterRenderedRichTextUid(template, _uid);
			}

			return template.cloneNode(true);
		} else {
			return _description;
		}
	};
};

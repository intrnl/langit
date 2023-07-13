import type { RefOf } from '@intrnl/bluesky-client/atp-schema';

import { alterRenderedRichTextUid, createRenderedRichText } from '../richtext/renderer.ts';
import { segmentRichText } from '../richtext/segmentize.ts';

import { type SignalizedProfile, mergeSignalizedProfile } from './profiles.ts';

import { type Signal, signal } from '~/utils/signals.ts';

type Facet = RefOf<'app.bsky.richtext.facet'>;
type List = RefOf<'app.bsky.graph.defs#listView'>;

export const lists: Record<string, WeakRef<SignalizedList>> = {};

/** @see BskyList */
export interface SignalizedList {
	_key?: number;
	uri: List['uri'];
	creator: SignalizedProfile;
	name: Signal<List['name']>;
	purpose: Signal<List['purpose']>;
	description: Signal<List['description']>;
	descriptionFacets: Signal<List['descriptionFacets']>;
	avatar: Signal<List['avatar']>;
	viewer: {
		muted: Signal<NonNullable<List['viewer']>['muted']>;
	};

	$renderedDescription: ReturnType<typeof createListRenderer>;
}

const createSignalizedList = (list: List, key?: number): SignalizedList => {
	return {
		_key: key,
		uri: list.uri,
		creator: mergeSignalizedProfile(list.creator, key),
		name: signal(list.name),
		purpose: signal(list.purpose),
		description: signal(list.description),
		descriptionFacets: signal(list.descriptionFacets),
		avatar: signal(list.avatar),
		viewer: {
			muted: signal(list.viewer?.muted),
		},
		$renderedDescription: createListRenderer(),
	};
};

export const mergeSignalizedList = (list: List, key?: number) => {
	let uri = list.uri;

	let ref: WeakRef<SignalizedList> | undefined = lists[uri];
	let val: SignalizedList;

	if (!ref || !(val = ref.deref()!)) {
		val = createSignalizedList(list, key);
		lists[uri] = new WeakRef(val);
	} else if (!key || val._key !== key) {
		val._key = key;

		val.creator = mergeSignalizedProfile(list.creator, key);

		val.name.value = list.name;
		val.purpose.value = list.purpose;
		val.description.value = list.description;
		val.descriptionFacets.value = list.descriptionFacets;
		val.avatar.value = list.avatar;

		val.viewer.muted.value = list.viewer?.muted;
	}

	return val;
};

const createListRenderer = () => {
	let _description: string;
	let _facets: Facet[] | undefined;
	let _uid: string;

	let template: HTMLElement | undefined;

	return function (this: SignalizedList, uid: string) {
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

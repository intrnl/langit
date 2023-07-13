import type { DID } from '@intrnl/bluesky-client/atp-schema';
import type { EnhancedResource, QueryFn } from '@intrnl/sq';

import { multiagent } from '~/globals/agent.ts';

import { type SignalizedList, mergeSignalizedList } from '../cache/lists.ts';
import type { SubscribedListsPage } from '../models/list.ts';

import { type Collection, pushCollection } from '../utils.ts';

// How many attempts it should try looking for more items before it gives up on empty pages.
const MAX_EMPTY = 3;

export type SubscribedListsResource = EnhancedResource<Collection<SubscribedListsPage>, string>;

export const getSubscribedListsKey = (uid: DID, limit: number, others = true) =>
	['getSubscribedLists', uid, limit, others] as const;
export const getSubscribedLists: QueryFn<
	Collection<SubscribedListsPage>,
	ReturnType<typeof getSubscribedListsKey>,
	string
> = async (key, { data: collection, param }) => {
	const [, uid, limit, others] = key;

	const agent = await multiagent.connect(uid);

	let cursor = param;
	let empty = 0;

	let lists: SignalizedList[];

	if (param && collection) {
		const pages = collection.pages;
		const last = pages[pages.length - 1];

		lists = last.remainingLists;
	} else {
		lists = [];
	}

	while (lists.length < limit) {
		const response = await agent.rpc.get('app.bsky.graph.getListMutes', {
			params: {
				limit: limit,
				cursor: cursor,
			},
		});

		const data = response.data;

		const arr = data.lists;
		const filtered = others ? arr.filter((list) => list.creator.did !== uid) : arr;
		const next = filtered.map((raw) => mergeSignalizedList(raw));

		cursor = arr.length >= limit ? data.cursor : undefined;
		empty = filtered.length > 0 ? 0 : empty + 1;
		lists = lists.concat(next);

		if (!cursor || empty >= MAX_EMPTY) {
			break;
		}
	}

	const remainingLists = lists.splice(limit, lists.length);

	const page: SubscribedListsPage = {
		cursor,
		lists,
		remainingLists,
	};

	return pushCollection(collection, page, param);
};

import type { DID, RefOf } from '@intrnl/bluesky-client/atp-schema';
import type { EnhancedResource, QueryFn } from '@intrnl/sq';

import { multiagent } from '~/globals/agent.ts';

import { type SignalizedList, mergeSignalizedList } from '../cache/lists.ts';
import type { SubscribedListsPage, SubscribedListsPageCursor } from '../models/list.ts';

import { type Collection, pushCollection } from '../utils.ts';

// How many attempts it should try looking for more items before it gives up on empty pages.
const MAX_EMPTY = 3;

export type SubscribedListsResource = EnhancedResource<
	Collection<SubscribedListsPage>,
	SubscribedListsPageCursor
>;

export const MUTE_LIST = 1;
export const BLOCK_LIST = 2;

export type ListType = 1 | 2;

const PAGE_SIZE = 30;

type RawList = RefOf<'app.bsky.graph.defs#listView'>;

export const getSubscribedListsKey = (uid: DID, type: ListType, limit = PAGE_SIZE) =>
	['getSubscribedLists', uid, type, limit] as const;
export const getSubscribedLists: QueryFn<
	Collection<SubscribedListsPage>,
	ReturnType<typeof getSubscribedListsKey>,
	SubscribedListsPageCursor
> = async (key, { data: collection, param }) => {
	const [, uid, type, limit] = key;

	const agent = await multiagent.connect(uid);

	let empty = 0;

	let cursor: string | null | undefined;
	let items: SignalizedList[] = [];

	if (param) {
		cursor = param.key;
		items = param.remaining;
	}

	const filter = (raw: RawList) => raw.creator.did !== uid;
	const map = (raw: RawList) => mergeSignalizedList(uid, raw);

	while (cursor !== null && items.length < limit) {
		const endpoint = type === MUTE_LIST ? 'app.bsky.graph.getListMutes' : 'app.bsky.graph.getListBlocks';
		const response = await agent.rpc.get(endpoint, {
			params: {
				limit: limit,
				cursor: cursor,
			},
		});

		const data = response.data;

		const arr = data.lists;
		const filtered = arr.filter(filter);
		const next = filtered.map(map);

		cursor = data.cursor;
		empty = filtered.length > 0 ? 0 : empty + 1;
		items = items.concat(next);

		if (!cursor || empty >= MAX_EMPTY) {
			break;
		}
	}

	const lists = items.slice(0, limit);
	const remaining = items.slice(limit);

	const page: SubscribedListsPage = {
		cursor: cursor || remaining.length > 0 ? { key: cursor || null, remaining: remaining } : undefined,
		lists: lists,
	};

	return pushCollection(collection, page, param);
};

import type { DID } from '@intrnl/bluesky-client/atp-schema';

import type { QueryFn } from '@intrnl/sq';

import { multiagent } from '~/globals/agent.ts';

import { type SignalizedList, mergeSignalizedList } from '../cache/lists.ts';
import { type SignalizedProfile, mergeSignalizedProfile } from '../cache/profiles.ts';
import { type Collection, pushCollection } from '../utils.ts';

import _getDid from './_did.ts';

export interface ListPage {
	cursor?: string;
	list: SignalizedList;
	items: Array<{ subject: SignalizedProfile }>;
}

const PAGE_SIZE = 30;

export const getListKey = (uid: DID, actor: string, list: string, limit = PAGE_SIZE) => {
	return ['getList', uid, actor, list, limit] as const;
};
export const getList: QueryFn<Collection<ListPage>, ReturnType<typeof getListKey>, string> = async (
	key,
	{ data: collection, param },
) => {
	const [, uid, actor, list, limit] = key;

	const agent = await multiagent.connect(uid);
	const did = await _getDid(agent, actor);

	const uri = `at://${did}/app.bsky.graph.list/${list}`;
	const response = await agent.rpc.get('app.bsky.graph.getList', {
		params: { list: uri, limit, cursor: param },
	});

	const data = response.data;
	const items = data.items;

	const page: ListPage = {
		// NOTE: `items` are likely to return less than what we requested, because
		// the API does not skip over records of users that have been deleted, so
		// use the cursor as is.
		// cursor: items.length >= limit ? data.cursor : undefined,
		cursor: data.cursor,
		list: mergeSignalizedList(uid, data.list),
		items: items.map((item) => ({ subject: mergeSignalizedProfile(uid, item.subject) })),
	};

	return pushCollection(collection, page, param);
};

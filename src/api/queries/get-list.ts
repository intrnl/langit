import type { DID, Records } from '@intrnl/bluesky-client/atp-schema';

import type { InitialDataFn, QueryFn } from '@intrnl/sq';

import { multiagent } from '~/globals/agent.ts';

import { type SignalizedList, mergeSignalizedList, lists } from '../cache/lists.ts';
import { type SignalizedProfile, mergeSignalizedProfile } from '../cache/profiles.ts';
import { type Collection, pushCollection, getRepoId } from '../utils.ts';

import _getDid from './_did.ts';
import { fetchProfileBatched } from './get-profile-batched.ts';

const PAGE_SIZE = 25;

export const createListUri = (actor: DID, rkey: string) => {
	return `at://${actor}/app.bsky.graph.list/${rkey}`;
};

export const getListInfoKey = (uid: DID, uri: string) => {
	return ['getListInfo', uid, uri] as const;
};
export const getListInfo: QueryFn<SignalizedList, ReturnType<typeof getListInfoKey>> = async (key) => {
	const [, uid, uri] = key;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.graph.getList', {
		params: {
			list: uri,
			limit: 1,
		},
	});

	const data = response.data;
	return mergeSignalizedList(uid, data.list);
};

export const getInitialListInfo: InitialDataFn<SignalizedList, ReturnType<typeof getListInfoKey>> = (key) => {
	const [, uid, uri] = key;

	const id = uid + '|' + uri;

	const ref = lists[id];
	const feed = ref?.deref();

	return feed && { data: feed };
};

export interface RawListItem {
	uri: string;
	subject: DID;
}

export interface ListMember {
	uri: string;
	subject: DID;
	profile: SignalizedProfile | undefined;
}

export interface ListMembersPage {
	cursor: string | undefined;
	members: ListMember[];
	remainingItems: RawListItem[];
}

export const getListMembersKey = (uid: DID, uri: string, limit = PAGE_SIZE) => {
	return ['getListMembers', uid, uri, limit] as const;
};
export const getListMembers: QueryFn<
	Collection<ListMembersPage>,
	ReturnType<typeof getListMembersKey>,
	string
> = async (key, { data: collection, param }) => {
	const [, uid, uri, limit] = key;

	const agent = await multiagent.connect(uid);
	const actor = getRepoId(uri);

	let cursor: string | undefined;
	let listItems: RawListItem[];

	if (param && collection) {
		const pages = collection.pages;
		const last = pages[pages.length - 1];

		cursor = param;
		listItems = last.remainingItems;
	} else {
		listItems = [];
	}

	// We don't have enough list item records to fulfill this request...
	while (listItems.length < limit) {
		const response = await agent.rpc.get('com.atproto.repo.listRecords', {
			params: {
				repo: actor,
				collection: 'app.bsky.graph.listitem',
				limit: 100,
				cursor: cursor,
			},
		});

		const data = response.data;
		const records = data.records;

		const items: RawListItem[] = [];

		for (let idx = 0, len = records.length; idx < len; idx++) {
			const record = records[idx];
			const value = record.value as Records['app.bsky.graph.listitem'];

			if (value.list !== uri) {
				continue;
			}

			items.push({ uri: record.uri, subject: value.subject });
		}

		listItems = listItems.concat(items);
		cursor = data.cursor;

		if (!cursor) {
			break;
		}
	}

	const fetches = listItems.slice(0, limit);
	const remaining = listItems.slice(limit);

	const promises: Promise<ListMember>[] = [];

	for (let idx = 0, len = fetches.length; idx < len; idx++) {
		const { uri, subject } = fetches[idx];
		const request = fetchProfileBatched([uid, subject]);

		promises.push(
			request.then(
				(value) => ({ uri: uri, subject: subject, profile: mergeSignalizedProfile(uid, value) }),
				(_err) => ({ uri: uri, subject: subject, profile: undefined }),
			),
		);
	}

	const members = await Promise.all(promises);

	const page: ListMembersPage = {
		cursor: cursor,
		members: members,
		remainingItems: remaining,
	};

	return pushCollection(collection, page, param);
};

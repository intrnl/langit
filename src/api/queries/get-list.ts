import type { DID, Records } from '@externdefs/bluesky-client/atp-schema';

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

export interface ListMembersPageCursor {
	key: string | null;
	remaining: RawListItem[];
}

export interface ListMembersPage {
	cursor: ListMembersPageCursor | undefined;
	members: ListMember[];
}

export const getListMembersKey = (uid: DID, uri: string, limit = PAGE_SIZE) => {
	return ['getListMembers', uid, uri, limit] as const;
};
export const getListMembers: QueryFn<
	Collection<ListMembersPage>,
	ReturnType<typeof getListMembersKey>,
	ListMembersPageCursor
> = async (key, { data: collection, param }) => {
	const [, uid, uri, limit] = key;

	const agent = await multiagent.connect(uid);
	const actor = getRepoId(uri);

	let attempts = 0;
	let cursor: string | undefined | null;
	let listItems: RawListItem[] = [];

	if (param) {
		cursor = param.key;
		listItems = param.remaining;
	}

	// We don't have enough list item records to fulfill this request...
	while (cursor !== null && listItems.length < limit) {
		const response = await agent.rpc.get('com.atproto.repo.listRecords', {
			params: {
				repo: actor,
				collection: 'app.bsky.graph.listitem',
				limit: 100,
				cursor: cursor || undefined,
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
		cursor = data.cursor || null;

		// Give up after 5 attempts
		if (++attempts >= 5) {
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
		cursor: cursor || remaining.length > 0 ? { key: cursor || null, remaining: remaining } : undefined,
		members: members,
	};

	return pushCollection(collection, page, param);
};

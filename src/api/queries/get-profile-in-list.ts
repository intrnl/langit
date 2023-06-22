import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '~/globals/agent.ts';
import { createBatchedFetch } from '~/utils/batch-fetch.ts';

import { type BskyListRecordsResponse, type BskyListSubjectRecord } from '../types.ts';
import { type DID } from '../utils.ts';

type Query = [uid: DID, actor: DID, list: string];
type Key = `${DID}|${string}`;

interface QueryResult {
	actor: DID;
	list: string;
	exists: string | undefined;
}

export const fetchIsProfileInList = createBatchedFetch<Query, Key, QueryResult>({
	limit: 100,
	timeout: 0,
	key: (query) => query[0],
	idFromQuery: (query) => `${query[1]}|${query[2]}`,
	idFromData: (data) => `${data.actor}|${data.list}`,
	fetch: async (queries) => {
		const uid = queries[0][0];

		const agent = await multiagent.connect(uid);

		const remaining = new Map<Key, Query>();
		const results: QueryResult[] = [];

		let cursor: string | undefined;

		for (let idx = 0, len = queries.length; idx < len; idx++) {
			const query = queries[idx];
			remaining.set(`${query[1]}|${query[2]}`, query);
		}

		while (remaining.size > 0) {
			const limit = 100;

			const response = await agent.rpc.get({
				method: 'com.atproto.repo.listRecords',
				params: {
					repo: uid,
					collection: 'app.bsky.graph.listitem',
					limit: limit,
					cursor: cursor,
				},
			});

			const data = response.data as BskyListRecordsResponse<BskyListSubjectRecord>;
			const records = data.records;

			for (let idx = 0, len = records.length; idx < len; idx++) {
				const record = records[idx];
				const value = record.value;

				const key: Key = `${value.subject}|${value.list}`;
				const match = remaining.get(key);

				if (match) {
					results.push({ actor: match[1], list: match[2], exists: record.uri });
					remaining.delete(key);
				}
			}

			cursor = data.cursor;

			if (!cursor || records.length < limit) {
				break;
			}
		}

		for (const query of remaining.values()) {
			results.push({ actor: query[1], list: query[2], exists: undefined });
		}

		return results;
	},
});

export const getProfileInListKey = (uid: DID, actor: DID, list: string) =>
	['getProfileInList', uid, actor, list] as const;
export const getProfileInList = async (ctx: QueryFunctionContext<ReturnType<typeof getProfileInListKey>>) => {
	const [, uid, actor, list] = ctx.queryKey;

	const match = await fetchIsProfileInList([uid, actor, list]);

	return match;
};

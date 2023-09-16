import type { DID, Records } from '@intrnl/bluesky-client/atp-schema';

import { multiagent } from '~/globals/agent.ts';

import type { SignalizedList } from '../cache/lists.ts';
import { getCurrentDate, getRecordId } from '../utils.ts';

import { acquire } from './_locker.ts';

type ListBlockRecord = Records['app.bsky.graph.listblock'];

export const subscribeBlockList = (uid: DID, list: SignalizedList) => {
	return acquire(list.viewer.blocked, async () => {
		const agent = await multiagent.connect(uid);

		const prev = list.viewer.blocked.peek();

		if (prev) {
			await agent.rpc.call('com.atproto.repo.deleteRecord', {
				data: {
					collection: 'app.bsky.graph.listblock',
					repo: uid,
					rkey: getRecordId(prev),
				},
			});

			list.viewer.blocked.value = undefined;
		} else {
			const record: ListBlockRecord = {
				createdAt: getCurrentDate(),
				subject: list.uri,
			};

			const response = await agent.rpc.call('com.atproto.repo.createRecord', {
				data: {
					collection: 'app.bsky.graph.listblock',
					repo: uid,
					record: record,
				},
			});

			list.viewer.blocked.value = response.data.uri;
		}
	});
};

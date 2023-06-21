import { multiagent } from '~/globals/agent.ts';

import { type SignalizedList } from '../cache/lists.ts';
import { type DID } from '../utils.ts';

import { acquire } from './_locker.ts';

export const subscribeMuteList = (uid: DID, list: SignalizedList) => {
	return acquire(list.viewer.muted, async () => {
		const agent = await multiagent.connect(uid);

		const prev = list.viewer.muted.peek();
		const uri = list.uri;

		if (prev) {
			await agent.rpc.post({
				method: 'app.bsky.graph.unmuteActorList',
				data: {
					list: uri,
				},
			});

			list.viewer.muted.value = false;
		} else {
			await agent.rpc.post({
				method: 'app.bsky.graph.muteActorList',
				data: {
					list: uri,
				},
			});

			list.viewer.muted.value = true;
		}
	});
};

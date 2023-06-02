import { type SignalizedProfile } from '../cache/profiles.ts';
import { multiagent } from '../global.ts';
import { type BskyCreateRecordResponse } from '../types.ts';
import { type DID, getRecordId } from '../utils.ts';

import { acquire } from './_locker.ts';

export const blockProfile = (uid: DID, profile: SignalizedProfile) => {
	return acquire(profile.viewer.following, async () => {
		const agent = await multiagent.connect(uid);

		const prev = profile.viewer.blocking.peek();

		if (prev) {
			await agent.rpc.post({
				method: 'com.atproto.repo.deleteRecord',
				data: {
					collection: 'app.bsky.graph.block',
					repo: uid,
					rkey: getRecordId(prev),
				},
			});

			profile.viewer.blocking.value = undefined;
		} else {
			const response = await agent.rpc.post({
				method: 'com.atproto.repo.createRecord',
				data: {
					repo: uid,
					collection: 'app.bsky.graph.block',
					record: {
						$type: 'app.bsky.graph.block',
						createdAt: new Date(),
						subject: profile.did,
					},
				},
			});

			const data = response.data as BskyCreateRecordResponse;

			profile.viewer.blocking.value = data.uri;
		}
	});
};

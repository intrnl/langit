import { multiagent } from '~/globals/agent.ts';

import { type SignalizedProfile } from '../cache/profiles.ts';
import { type BskyCreateRecordResponse } from '../types.ts';
import { type DID, getRecordId } from '../utils.ts';

import { acquire } from './_locker.ts';

export const followProfile = (uid: DID, profile: SignalizedProfile) => {
	return acquire(profile.viewer.following, async () => {
		const agent = await multiagent.connect(uid);

		const prev = profile.viewer.following.peek();

		if (prev) {
			await agent.rpc.post({
				method: 'com.atproto.repo.deleteRecord',
				data: {
					collection: 'app.bsky.graph.follow',
					repo: uid,
					rkey: getRecordId(prev),
				},
			});

			profile.viewer.following.value = undefined;
			profile.followersCount.value--;
		} else {
			const response = await agent.rpc.post({
				method: 'com.atproto.repo.createRecord',
				data: {
					repo: uid,
					collection: 'app.bsky.graph.follow',
					record: {
						$type: 'app.bsky.graph.follow',
						createdAt: new Date(),
						subject: profile.did,
					},
				},
			});

			const data = response.data as BskyCreateRecordResponse;

			profile.viewer.following.value = data.uri;
			profile.followersCount.value++;
		}
	});
};

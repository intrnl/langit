import type { DID, Records } from '@externdefs/bluesky-client/atp-schema';

import { multiagent } from '~/globals/agent.ts';

import type { SignalizedProfile } from '../cache/profiles.ts';
import { getCurrentDate, getRecordId } from '../utils.ts';

import { acquire } from './_locker.ts';

type FollowRecord = Records['app.bsky.graph.follow'];

export const followProfile = (uid: DID, profile: SignalizedProfile) => {
	return acquire(profile.viewer.following, async () => {
		const agent = await multiagent.connect(uid);

		const prev = profile.viewer.following.peek();

		if (prev) {
			await agent.rpc.call('com.atproto.repo.deleteRecord', {
				data: {
					collection: 'app.bsky.graph.follow',
					repo: uid,
					rkey: getRecordId(prev),
				},
			});

			profile.viewer.following.value = undefined;
			profile.followersCount.value--;
		} else {
			const record: FollowRecord = {
				createdAt: getCurrentDate(),
				subject: profile.did,
			};

			const response = await agent.rpc.call('com.atproto.repo.createRecord', {
				data: {
					repo: uid,
					collection: 'app.bsky.graph.follow',
					record: record,
				},
			});

			profile.viewer.following.value = response.data.uri;
			profile.followersCount.value++;
		}
	});
};

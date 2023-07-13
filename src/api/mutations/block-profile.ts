import type { DID } from '@intrnl/bluesky-client/atp-schema';

import { multiagent } from '~/globals/agent.ts';

import type { SignalizedProfile } from '../cache/profiles.ts';
import { getRecordId } from '../utils.ts';

import { acquire } from './_locker.ts';

export const blockProfile = (uid: DID, profile: SignalizedProfile) => {
	return acquire(profile.viewer.following, async () => {
		const agent = await multiagent.connect(uid);

		const prev = profile.viewer.blocking.peek();

		if (prev) {
			await agent.rpc.call('com.atproto.repo.deleteRecord', {
				data: {
					collection: 'app.bsky.graph.block',
					repo: uid,
					rkey: getRecordId(prev),
				},
			});

			profile.viewer.blocking.value = undefined;
		} else {
			const response = await agent.rpc.call('com.atproto.repo.createRecord', {
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

			profile.viewer.blocking.value = response.data.uri;
		}
	});
};

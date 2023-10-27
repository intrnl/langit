import type { DID, Records } from '@externdefs/bluesky-client/atp-schema';

import { multiagent } from '~/globals/agent.ts';

import type { SignalizedProfile } from '../cache/profiles.ts';
import { getCurrentDate, getRecordId } from '../utils.ts';

import { acquire } from './_locker.ts';

type BlockRecord = Records['app.bsky.graph.block'];

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
			const record: BlockRecord = {
				createdAt: getCurrentDate(),
				subject: profile.did,
			};

			const response = await agent.rpc.call('com.atproto.repo.createRecord', {
				data: {
					repo: uid,
					collection: 'app.bsky.graph.block',
					record: record,
				},
			});

			profile.viewer.blocking.value = response.data.uri;
		}
	});
};

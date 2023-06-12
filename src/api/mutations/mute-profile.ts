import { multiagent } from '~/globals/agent.ts';

import { type SignalizedProfile } from '../cache/profiles.ts';
import { type DID } from '../utils.ts';

import { acquire } from './_locker.ts';

export const muteProfile = (uid: DID, profile: SignalizedProfile) => {
	return acquire(profile.viewer.muted, async () => {
		const agent = await multiagent.connect(uid);

		const prev = profile.viewer.muted.peek();

		if (prev) {
			await agent.rpc.post({
				method: 'app.bsky.graph.unmuteActor',
				data: {
					actor: profile.did,
				},
			});

			profile.viewer.muted.value = false;
		} else {
			await agent.rpc.post({
				method: 'app.bsky.graph.muteActor',
				data: {
					actor: profile.did,
				},
			});

			profile.viewer.muted.value = true;
		}
	});
};

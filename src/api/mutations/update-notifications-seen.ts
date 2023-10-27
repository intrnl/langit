import type { DID } from '@externdefs/bluesky-client/atp-schema';

import { multiagent } from '~/globals/agent.ts';

export const updateNotificationsSeen = async (uid: DID, date = new Date()) => {
	const agent = await multiagent.connect(uid);

	await agent.rpc.call('app.bsky.notification.updateSeen', {
		data: { seenAt: date.toISOString() },
	});
};

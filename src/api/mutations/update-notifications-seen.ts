import { multiagent } from '~/globals/agent.ts';

import { type DID } from '../utils.ts';

export const updateNotificationsSeen = async (uid: DID, date = new Date()) => {
	const agent = await multiagent.connect(uid);

	await agent.rpc.post({
		method: 'app.bsky.notification.updateSeen',
		data: { seenAt: date },
	});
};

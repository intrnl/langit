import { multiagent } from '../global.ts';
import { type DID } from '../utils.ts';

export const updateNotificationsSeen = async (uid: DID, date = new Date()) => {
	const agent = await multiagent.connect(uid);

	await agent.rpc.post({
		method: 'app.bsky.notification.updateSeen',
		data: { seenAt: date },
	});
};

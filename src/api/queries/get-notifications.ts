import type { DID } from '@intrnl/bluesky-client/atp-schema';
import type { QueryFn } from '@intrnl/sq';

import { multiagent } from '~/globals/agent.ts';

import { type Collection, pushCollection } from '../utils.ts';

import { type NotificationsPage, createNotificationsPage } from '../models/notifications.ts';

export const getNotificationsKey = (uid: DID, limit: number) => ['getNotifications', uid, limit] as const;
export const getNotifications: QueryFn<
	Collection<NotificationsPage>,
	ReturnType<typeof getNotificationsKey>,
	string
> = async (key, { data: collection, param }) => {
	const [, uid, limit] = key;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.notification.listNotifications', {
		params: {
			limit: limit,
			cursor: param,
		},
	});

	const page = createNotificationsPage(response.data);

	return pushCollection(collection, page, param);
};

export interface LatestNotification {
	cid: string | undefined;
	read: boolean;
}

export const getNotificationsLatestKey = (uid: DID) => ['getNotificationsLatest', uid] as const;
export const getNotificationsLatest: QueryFn<
	LatestNotification,
	ReturnType<typeof getNotificationsLatestKey>
> = async (key) => {
	const [, uid] = key;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.notification.listNotifications', {
		params: { limit: 1 },
	});

	const notifications = response.data.notifications;

	if (notifications.length > 0) {
		const notif = notifications[0];

		return { cid: notif.cid, read: notif.isRead };
	}

	return { cid: undefined, read: true };
};

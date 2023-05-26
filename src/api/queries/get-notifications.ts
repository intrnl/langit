import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '../global.ts';
import { type BskyNotificationsResponse } from '../types.ts';
import { type DID } from '../utils.ts';

import { createNotificationsPage } from '../models/notifications.ts';

export const getNotificationsKey = (uid: DID) => ['getNotifications', uid] as const;
export const createNotificationsQuery = (limit: number) => {
	return async (ctx: QueryFunctionContext<ReturnType<typeof getNotificationsKey>, string>) => {
		const [, uid] = ctx.queryKey;

		const agent = await multiagent.connect(uid);

		const response = await agent.rpc.get({
			method: 'app.bsky.notification.listNotifications',
			params: { limit: limit, cursor: ctx.pageParam },
		});

		const data = response.data as BskyNotificationsResponse;
		const page = createNotificationsPage(data);

		return page;
	};
};

export const getNotificationsLatestKey = (uid: DID) => ['getNotificationsLatest', uid] as const;
export const getNotificationsLatest = async (
	ctx: QueryFunctionContext<ReturnType<typeof getNotificationsLatestKey>>,
) => {
	const [, uid] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get({
		method: 'app.bsky.notification.listNotifications',
		params: { limit: 1 },
	});

	const data = response.data as BskyNotificationsResponse;
	const notifications = data.notifications;

	if (notifications.length > 0) {
		const notif = notifications[0];

		return { cid: notif.cid, read: notif.isRead };
	}

	return undefined;
};

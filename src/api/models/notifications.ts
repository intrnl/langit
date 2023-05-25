import {
	type BskyFollowNotification,
	type BskyLikeNotification,
	type BskyNotificationsResponse,
	type BskyReplyNotification,
} from '../types.ts';

export interface FollowNotificationSlice {
	type: 'follow';
	read: boolean;
	date: number;
	items: BskyFollowNotification[];
}

export interface LikeNotificationSlice {
	type: 'like';
	read: boolean;
	key: string;
	date: number;
	items: BskyLikeNotification[];
}

export interface ReplyNotificationSlice {
	type: 'reply';
	read: boolean;
	date: number;
	item: BskyReplyNotification;
}

export type NotificationSlice = FollowNotificationSlice | LikeNotificationSlice | ReplyNotificationSlice;

export interface NotificationsPage {
	cursor?: string;
	cid?: string;
	date?: string;
	slices: NotificationSlice[];
}

// 6 hours
const MAX_MERGE_TIME = 6 * 60 * 60 * 1_000;

export const createNotificationsPage = (data: BskyNotificationsResponse): NotificationsPage => {
	const cursor = data.cursor;
	const notifications = data.notifications;

	const slices: NotificationSlice[] = [];
	let slen = 0;

	loop:
	for (let i = notifications.length - 1; i >= 0; i--) {
		const item = notifications[i];
		const reason = item.reason;

		const date = new Date(item.indexedAt).getTime();

		if (reason === 'follow') {
			for (let j = 0; j < slen; j++) {
				const slice = slices[j];

				if (slice.type !== reason) {
					continue;
				}

				if ((date - slice.date) <= MAX_MERGE_TIME) {
					slice.items.push(item);

					if (!item.isRead) {
						slice.read = false;
					}

					if (j !== 0) {
						slices.splice(j, 1);
						slices.unshift(slice);
					}

					continue loop;
				}
			}

			slices.unshift({
				type: reason,
				read: item.isRead,
				date: date,
				items: [item],
			});
		}
		else if (reason === 'like') {
			const key = item.reasonSubject;

			for (let j = 0; j < slen; j++) {
				const slice = slices[j];

				if (slice.type !== reason || slice.key !== key) {
					continue;
				}

				if ((date - slice.date) <= MAX_MERGE_TIME) {
					slice.items.push(item);

					if (!item.isRead) {
						slice.read = false;
					}

					if (j !== 0) {
						slices.splice(j, 1);
						slices.unshift(slice);
					}

					continue loop;
				}
			}

			slices.unshift({
				type: reason,
				read: item.isRead,
				key: key,
				date: date,
				items: [item],
			});
		}
		else if (reason === 'reply') {
			slen++;

			slices.unshift({
				type: reason,
				read: item.isRead,
				date: date,
				item: item,
			});
		}
	}

	return {
		cursor: cursor,
		cid: notifications.length > 0 ? notifications[0].cid : undefined,
		date: notifications.length > 0 ? notifications[0].indexedAt : undefined,
		slices: slices,
	};
};

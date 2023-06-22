import {
	type BskyFollowNotification,
	type BskyLikeNotification,
	type BskyNotificationsResponse,
	type BskyQuoteNotification,
	type BskyReplyNotification,
	type BskyRepostNotification,
} from '../types.ts';
import { getCollectionId } from '../utils.ts';

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

export interface QuoteNotificationSlice {
	type: 'quote';
	read: boolean;
	date: number;
	item: BskyQuoteNotification;
}

export interface RepostNotificationSlice {
	type: 'repost';
	read: boolean;
	key: string;
	date: number;
	items: BskyRepostNotification[];
}

export type NotificationSlice =
	| FollowNotificationSlice
	| LikeNotificationSlice
	| QuoteNotificationSlice
	| ReplyNotificationSlice
	| RepostNotificationSlice;

export interface NotificationsPage {
	cursor?: string;
	cid?: string;
	date?: string;
	length: number;
	slices: NotificationSlice[];
}

// 6 hours
const MAX_MERGE_TIME = 6 * 60 * 60 * 1_000;

export const createNotificationsPage = (data: BskyNotificationsResponse): NotificationsPage => {
	const cursor = data.cursor;
	const notifications = data.notifications;
	const len = notifications.length;

	const slices: NotificationSlice[] = [];
	let slen = 0;

	loop: for (let i = len - 1; i >= 0; i--) {
		const item = notifications[i];
		const reason = item.reason;

		const date = new Date(item.indexedAt).getTime();

		if (reason === 'follow') {
			for (let j = 0; j < slen; j++) {
				const slice = slices[j];

				if (slice.type !== reason) {
					continue;
				}

				if (date - slice.date <= MAX_MERGE_TIME) {
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

			slen++;

			slices.unshift({
				type: reason,
				read: item.isRead,
				date: date,
				items: [item],
			});
		} else if (reason === 'like' || reason === 'repost') {
			const key = item.reasonSubject;
			const collection = getCollectionId(key);

			// skip if they're not related to posts.
			if (collection !== 'app.bsky.feed.post') {
				continue;
			}

			for (let j = 0; j < slen; j++) {
				const slice = slices[j];

				if (slice.type !== reason || slice.key !== key) {
					continue;
				}

				if (date - slice.date <= MAX_MERGE_TIME) {
					// @ts-expect-error this won't mix up, as we already filter by type
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

			slen++;

			slices.unshift({
				type: reason,
				read: item.isRead,
				key: key,
				date: date,
				// @ts-expect-error
				items: [item],
			});
		} else if (reason === 'reply' || reason === 'quote') {
			slen++;

			slices.unshift({
				type: reason,
				read: item.isRead,
				date: date,
				// @ts-expect-error
				item: item,
			});
		}
	}

	return {
		cursor: cursor,
		cid: len > 0 ? notifications[0].cid : undefined,
		date: len > 0 ? notifications[0].indexedAt : undefined,
		length: len,
		slices: slices,
	};
};

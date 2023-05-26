import { Match, Switch } from 'solid-js';

import { createQuery } from '@tanstack/solid-query';

import { posts as postsCache } from '~/api/cache/posts';
import { type ReplyNotificationSlice } from '~/api/models/notifications.ts';
import { type DID } from '~/api/utils.ts';

import { getPost, getPostKey } from '~/api/queries/get-post.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import Post from './Post';

export interface NotificationReplyProps {
	uid: DID;
	data: ReplyNotificationSlice;
}

const NotificationReply = (props: NotificationReplyProps) => {
	const uid = () => props.uid;

	const reply = () => props.data.item;

	const replyUri = () => reply().uri;
	const parentUri = () => reply().reasonSubject;

	const replyQuery = createQuery({
		queryKey: () => getPostKey(uid(), replyUri()),
		queryFn: getPost,
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
		initialData: () => {
			const ref = postsCache[replyUri()];
			return ref?.deref();
		},
	});

	const parentQuery = createQuery({
		queryKey: () => getPostKey(uid(), parentUri()),
		queryFn: getPost,
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
		initialData: () => {
			const ref = postsCache[parentUri()];
			return ref?.deref();
		},
	});

	return (
		<Switch>
			<Match when={replyQuery.isLoading || parentQuery.isLoading}>
				<div class="flex justify-center border-b border-divider p-3">
					<CircularProgress />
				</div>
			</Match>

			<Match when={replyQuery.data && parentQuery.data} keyed>
				{/* @ts-expect-error: not sure what's up with this one*/}
				{() => {
					const post = replyQuery.data!;
					const parent = parentQuery.data!;

					return <Post interactive uid={uid()} post={post} parent={parent} highlight={!reply().isRead} />;
				}}
			</Match>
		</Switch>
	);
};

export default NotificationReply;

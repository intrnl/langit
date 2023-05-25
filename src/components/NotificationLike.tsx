import { For, Match, Show, Switch, createMemo } from 'solid-js';
import { type JSX } from 'solid-js/jsx-runtime';

import { createQuery } from '@tanstack/solid-query';

import { posts as postsCache } from '~/api/cache/posts.ts';
import { type LikeNotificationSlice } from '~/api/models/notifications.ts';
import { type DID, getRecordId, getRepoId } from '~/api/utils.ts';

import { getPost, getPostKey } from '~/api/queries/get-post.ts';

import { A } from '~/router.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import EmbedRecord from '~/components/EmbedRecord.tsx';

import FavoriteIcon from '~/icons/baseline-favorite.tsx';

export interface NotificationLikeProps {
	uid: DID;
	data: LikeNotificationSlice;
}

// How many names to show before considering truncation
const MAX_NAMES = 2;

// How many names to show after truncation
const MAX_NAMES_AFTER_TRUNCATION = 1;

// How many avatars to show
const MAX_AVATARS = 8;

const PostContent = (props: { uid: DID; uri: string }) => {
	const uid = () => props.uid;
	const uri = () => props.uri;

	const postQuery = createQuery({
		queryKey: () => getPostKey(uid(), uri()),
		queryFn: getPost,
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
		initialData: () => {
			const ref = postsCache[uri()];
			return ref?.deref();
		},
	});

	return (
		<Switch>
			<Match when={postQuery.isLoading}>
				<div class="flex justify-center border border-divider p-3">
					<CircularProgress />
				</div>
			</Match>

			<Match when={postQuery.data}>
				{(data) => {
					const author = () => data().author;
					const record = () => data().record.value;

					return (
						<EmbedRecord
							uid={uid()}
							// lol
							record={{
								$type: 'app.bsky.embed.record#viewRecord',
								uri: data().uri,
								// @ts-expect-error this is the only values required for author object
								author: {
									did: author().did,
									avatar: author().avatar.value,
									handle: author().handle.value,
									displayName: author().handle.value,
								},
								embeds: data().embed.value ? [data().embed.value!] : [],
								value: {
									createdAt: record().createdAt,
									text: record().text,
								},
							}}
						/>
					);
				}}
			</Match>
		</Switch>
	);
};

const NotificationLike = (props: NotificationLikeProps) => {
	const uid = () => props.uid;
	const data = () => props.data;

	const subject = () => data().items[0].record.subject;

	const text = createMemo(() => {
		const items = data().items;
		const sliced = items.slice(0, items.length > MAX_NAMES ? MAX_NAMES_AFTER_TRUNCATION : MAX_NAMES);
		const remaining = items.length - sliced.length;

		const nodes: JSX.Element[] = [];

		for (let idx = 0, len = sliced.length; idx < len; idx++) {
			const item = sliced[idx];
			const author = item.author;

			if (len > 1) {
				if (remaining < 1 && idx === len - 1) {
					nodes.push(` and `);
				} else if (idx !== 0) {
					nodes.push(`, `);
				}
			}

			nodes.push(
				<A
					href="/u/:uid/profile/:actor"
					params={{ uid: uid(), actor: author.did }}
					class="font-bold hover:underline"
				>
					{author.displayName || `@${author.handle}`}
				</A>,
			);
		}

		if (remaining > 0) {
			nodes.push(` and ${remaining} others`);
		}

		nodes.push(` liked your post`);

		return nodes;
	});

	return (
		<A
			href="/u/:uid/profile/:actor/post/:status"
			params={{ uid: uid(), actor: getRepoId(subject().uri), status: getRecordId(subject().uri) }}
			class="flex gap-3 border-b border-divider px-4 py-3 hover:bg-hinted"
			classList={{ 'bg-accent/20': !data().read }}
		>
			<div class="flex w-12 shrink-0 flex-col items-end gap-3">
				<FavoriteIcon class="text-3xl" />
			</div>
			<div class="flex min-w-0 grow flex-col gap-3">
				<div class="flex gap-2">
					<For each={data().items.slice(0, MAX_AVATARS)}>
						{(item) => {
							const author = item.author;

							return (
								<A
									href="/u/:uid/profile/:actor"
									params={{ uid: uid(), actor: author.did }}
									class="h-7.5 w-7.5 overflow-hidden rounded-full bg-muted-fg hover:opacity-80"
								>
									<Show when={author.avatar}>{(avatar) => <img src={avatar()} class="h-full w-full" />}</Show>
								</A>
							);
						}}
					</For>
				</div>

				<div class="break-words text-sm">{text()}</div>

				<PostContent uid={uid()} uri={subject().uri} />
			</div>
		</A>
	);
};

export default NotificationLike;

import { type Accessor, Match, Switch, For, Show } from 'solid-js';
import { type JSX } from 'solid-js/jsx-runtime';
import { Dynamic } from 'solid-js/web';

import { createQuery } from '@tanstack/solid-query';

import { posts as postsCache } from '~/api/cache/posts.ts';
import {
	type FollowNotificationSlice,
	type LikeNotificationSlice,
	type NotificationSlice,
	type ReplyNotificationSlice,
	type RepostNotificationSlice,
} from '~/api/models/notifications.ts';
import { type DID } from '~/api/utils.ts';

import { getPost, getPostKey } from '~/api/queries/get-post.ts';

import { A } from '~/router.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import EmbedRecord from '~/components/EmbedRecord.tsx';
import Post from '~/components/Post.tsx';

import PersonIcon from '~/icons/baseline-person.tsx';
import FavoriteIcon from '~/icons/baseline-favorite.tsx';
import RepeatIcon from '~/icons/baseline-repeat.tsx';

export interface NotificationProps {
	uid: DID;
	data: NotificationSlice;
}

// How many names to show before considering truncation
const MAX_NAMES = 2;

// How many names to show after truncation
const MAX_NAMES_AFTER_TRUNCATION = 1;

// How many avatars to show
const MAX_AVATARS = 8;

const ICON_MAP = {
	follow: { component: PersonIcon, class: 'text-accent' },
	like: { component: FavoriteIcon, class: 'text-red-600' },
	repost: { component: RepeatIcon, class: 'text-green-600' },
};

const Notification = (props: NotificationProps) => {
	const uid = () => props.uid;
	const _data = () => props.data;

	return (
		<Switch>
			<Match when={_data().type === 'reply'}>
				{/* @ts-expect-error */}
				{() => {
					const data = _data as any as Accessor<ReplyNotificationSlice>;

					const reply = () => data().item;

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
								{/* @ts-expect-error*/}
								{() => {
									const post = replyQuery.data!;
									const parent = parentQuery.data!;

									return (
										<Post interactive uid={uid()} post={post} parent={parent} highlight={!data().read} />
									);
								}}
							</Match>
						</Switch>
					);
				}}
			</Match>

			<Match when={true}>
				{/* @ts-expect-error */}
				{() => {
					const data = _data as Accessor<
						FollowNotificationSlice | LikeNotificationSlice | RepostNotificationSlice
					>;

					return (
						<div
							class="flex gap-3 border-b border-divider px-4 py-3"
							classList={{ 'bg-accent/20': !data().read }}
						>
							<div class="flex w-12 shrink-0 flex-col items-end gap-3">
								{/* @ts-expect-error */}
								{() => {
									const map = ICON_MAP[data().type];

									return (
										<div class="flex h-7.5 w-7.5 items-center justify-center">
											<Dynamic
												component={/* @once */ map.component}
												class={/* @once */ `text-2xl ${map.class}`}
											/>
										</div>
									);
								}}
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
													<Show when={author.avatar}>
														{(avatar) => <img src={avatar()} class="h-full w-full" />}
													</Show>
												</A>
											);
										}}
									</For>
								</div>

								<div class="break-words text-sm">{renderText(uid(), data())}</div>

								<Show when={data().type === 'like' || data().type === 'repost'}>
									{/* @ts-expect-error */}
									{() => {
										const data = _data as Accessor<LikeNotificationSlice | RepostNotificationSlice>;

										const subject = () => data().items[0].record.subject;
										const uri = () => subject().uri;

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
									}}
								</Show>
							</div>
						</div>
					);
				}}
			</Match>
		</Switch>
	);
};

export default Notification;

const renderText = (
	uid: DID,
	data: FollowNotificationSlice | LikeNotificationSlice | RepostNotificationSlice,
) => {
	const items = data.items;
	const sliced = items.slice(0, items.length > MAX_NAMES ? MAX_NAMES_AFTER_TRUNCATION : MAX_NAMES);
	const remaining = items.length - sliced.length;

	const type = data.type;

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
				params={{ uid: uid, actor: author.did }}
				class="font-bold hover:underline"
			>
				{author.displayName || `@${author.handle}`}
			</A>,
		);
	}

	if (remaining > 0) {
		nodes.push(` and ${remaining} others`);
	}

	if (type === 'follow') {
		nodes.push(` followed you`);
	} else if (type === 'like') {
		nodes.push(` liked your post`);
	} else if (type === 'repost') {
		nodes.push(` reposted your post`);
	}

	return nodes;
};

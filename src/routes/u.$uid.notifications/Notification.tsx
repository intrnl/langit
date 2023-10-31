import { For, Match, Show, Switch } from 'solid-js';
import type { JSX } from 'solid-js/jsx-runtime';
import { Dynamic } from 'solid-js/web';

import type { DID } from '@externdefs/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';

import {
	type FollowNotificationSlice,
	type LikeNotificationSlice,
	type NotificationSlice,
	type RepostNotificationSlice,
} from '~/api/models/notifications.ts';

import { getInitialPost, getPost, getPostKey } from '~/api/queries/get-post.ts';

import { generatePath } from '~/router.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import EmbedRecord from '~/components/EmbedRecord.tsx';
import Post from '~/components/Post.tsx';

import FavoriteIcon from '~/icons/baseline-favorite.tsx';
import PersonIcon from '~/icons/baseline-person.tsx';
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
	const data = () => props.data;

	return (
		<Switch>
			<Match
				when={(() => {
					const $data = data();
					const type = $data.type;

					if (type === 'reply' || type === 'quote' || type === 'mention') {
						return $data;
					}
				})()}
			>
				{(data) => {
					const replyObj = () => data().item;
					const replyUri = () => replyObj().uri;

					const [reply] = createQuery({
						key: () => getPostKey(uid(), replyUri()),
						fetch: getPost,
						refetchOnMount: false,
						initialData: getInitialPost,
					});

					return (
						<Switch>
							<Match when={reply()}>
								{(reply) => {
									return <Post interactive uid={uid()} post={reply()} highlight={!data().read} />;
								}}
							</Match>

							<Match when>
								<div class="flex justify-center border-b border-divider p-3">
									<CircularProgress />
								</div>
							</Match>
						</Switch>
					);
				}}
			</Match>

			<Match
				when={(() => {
					const $data = data();
					const type = $data.type;

					if (type === 'follow' || type === 'like' || type === 'repost') {
						return $data;
					}
				})()}
			>
				{(data) => {
					return (
						<div
							class="flex gap-3 border-b border-divider px-4 py-3"
							classList={{ 'bg-accent/20': !data().read }}
						>
							<div class="flex w-10 shrink-0 flex-col items-end gap-3">
								{(() => {
									const map = ICON_MAP[data().type];

									return (
										<div class="flex h-7.5 w-7.5 items-center justify-center">
											<Dynamic
												component={/* @once */ map.component}
												class={/* @once */ `text-2xl ${map.class}`}
											/>
										</div>
									);
								})()}
							</div>
							<div class="flex min-w-0 grow flex-col gap-3">
								<div class="flex gap-2">
									<For each={data().items.slice(0, MAX_AVATARS)}>
										{(item) => {
											const author = item.author;

											return (
												<a
													link
													href={generatePath('/u/:uid/profile/:actor', { uid: uid(), actor: author.did })}
													title={
														author.displayName
															? `${author.displayName} (@${author.handle})`
															: `@${author.handle}`
													}
													class="h-7.5 w-7.5 overflow-hidden rounded-full bg-muted-fg hover:opacity-80"
												>
													<Show when={author.avatar}>
														{(avatar) => <img src={avatar()} class="h-full w-full" />}
													</Show>
												</a>
											);
										}}
									</For>
								</div>

								<div class="overflow-hidden break-words text-sm">{renderText(uid(), data())}</div>

								<Show
									when={(() => {
										const $data = data();
										const type = $data.type;

										if (type === 'like' || type === 'repost') {
											return $data;
										}
									})()}
								>
									{(data) => {
										const subject = () => data().items[0].record.subject;
										const uri = () => subject().uri;

										const [post] = createQuery({
											key: () => getPostKey(uid(), uri()),
											fetch: getPost,
											refetchOnMount: false,
											initialData: getInitialPost,
										});

										return (
											<Switch>
												<Match when={post()}>
													{(data) => {
														const author = () => data().author;
														const record = () => data().record.value;

														return (
															<EmbedRecord
																uid={uid()}
																record={{
																	$type: 'app.bsky.embed.record#viewRecord',
																	uri: data().uri,
																	// @ts-expect-error
																	cid: null,
																	// @ts-expect-error
																	indexedAt: null,
																	author: {
																		did: author().did,
																		avatar: author().avatar.value,
																		handle: author().handle.value,
																		displayName: author().displayName.value,
																	},
																	embeds: data().embed.value ? [data().embed.value!] : [],
																	value: {
																		createdAt: record().createdAt,
																		text: record().text,
																	},
																}}
																interactive
															/>
														);
													}}
												</Match>

												<Match when>
													<div class="flex justify-center rounded-md border border-divider p-3">
														<CircularProgress />
													</div>
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
	const sliced = Math.min(items.length, items.length > MAX_NAMES ? MAX_NAMES_AFTER_TRUNCATION : MAX_NAMES);
	const remaining = items.length - sliced;

	const type = data.type;

	const nodes: JSX.Element[] = [];

	for (let idx = 0; idx < sliced; idx++) {
		const item = items[idx];
		const author = item.author;

		if (sliced > 1) {
			if (remaining < 1 && idx === sliced - 1) {
				nodes.push(` and `);
			} else if (idx !== 0) {
				nodes.push(`, `);
			}
		}

		nodes.push(
			<a
				link
				dir="auto"
				href={generatePath('/u/:uid/profile/:actor', { uid: uid, actor: author.did })}
				class="inline-block overflow-hidden align-top font-bold hover:underline"
			>
				{author.displayName?.trim() || `@${author.handle}`}
			</a>,
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

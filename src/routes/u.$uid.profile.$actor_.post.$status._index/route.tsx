import { For, Match, Show, Switch } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { XRPCError } from '@intrnl/bluesky-client/xrpc-utils';
import { createQuery } from '@intrnl/sq';
import { Title } from '@solidjs/meta';
import { A as UntypedAnchor, useLocation, useSearchParams } from '@solidjs/router';

import { getRecordId, getRepoId } from '~/api/utils.ts';

import { favoritePost } from '~/api/mutations/favorite-post.ts';
import { BlockedThreadError, getPostThread, getPostThreadKey } from '~/api/queries/get-post-thread.ts';

import { openModal } from '~/globals/modals.tsx';
import { A, useParams } from '~/router.ts';
import * as comformat from '~/utils/intl/comformatter.ts';
import * as relformat from '~/utils/intl/relformatter.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import Embed from '~/components/Embed.tsx';
import EmbedRecordBlocked from '~/components/EmbedRecordBlocked.tsx';
import EmbedRecordNotFound from '~/components/EmbedRecordNotFound.tsx';
import PostMenu from '~/components/menus/PostMenu.tsx';
import PostRepostMenu from '~/components/menus/PostRepostMenu.tsx';
import PostShareMenu from '~/components/menus/PostShareMenu.tsx';
import Post from '~/components/Post.tsx';
import VirtualContainer, { createPostKey } from '~/components/VirtualContainer.tsx';
import button from '~/styles/primitives/button.ts';

import FavoriteIcon from '~/icons/baseline-favorite.tsx';
import MoreHorizIcon from '~/icons/baseline-more-horiz.tsx';
import RepeatIcon from '~/icons/baseline-repeat.tsx';
import ShareIcon from '~/icons/baseline-share.tsx';
import ChatBubbleOutlinedIcon from '~/icons/outline-chat-bubble.tsx';
import FavoriteOutlinedIcon from '~/icons/outline-favorite.tsx';

import PostTranslation from './PostTranslation.tsx';

const seen = new Set<string>();

const MAX_ANCESTORS = 10;
const MAX_DESCENDANTS = 4;

const AuthenticatedPostPage = () => {
	const params = useParams('/u/:uid/profile/:actor/post/:status');
	const location = useLocation();

	const [searchParams, setSearchParams] = useSearchParams<{ tl?: 'y' }>();

	const uid = () => params.uid as DID;
	const actor = () => params.actor;
	const status = () => params.status;

	const [thread, { refetch }] = createQuery({
		key: () => getPostThreadKey(uid(), actor(), status(), MAX_DESCENDANTS + 1, MAX_ANCESTORS + 1),
		fetch: getPostThread,
		staleTime: 10_000,
		refetchOnMount: true,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
	});

	const focusRef = (node: HTMLDivElement) => {
		requestAnimationFrame(() => {
			const $thread = thread();
			const key = location.key;

			if ($thread && key && !seen.has(key)) {
				seen.add(key);
				node.scrollIntoView();
			}
		});
	};

	const renderTitle = () => {
		const $thread = thread();

		if ($thread) {
			const post = $thread.post;

			const author = post.author;
			const record = post.record.value;

			return `${author.displayName.value || `@${author.handle.value}`}: "${record.text}" / Langit`;
		}

		return `Post / Langit`;
	};

	return (
		<div class="flex flex-col">
			<Title>{renderTitle()}</Title>

			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Post</p>
			</div>

			<Switch>
				<Match when={!thread.loading && thread.error} keyed>
					{(error) => (
						<Switch
							fallback={
								<div class="p-4">
									<div class="mb-4 text-sm">
										<p class="font-bold">Something went wrong</p>
										<p class="text-muted-fg">{'' + error}</p>
									</div>

									<button onClick={() => refetch(true)} class={/* @once */ button({ color: 'primary' })}>
										Try again
									</button>
								</div>
							}
						>
							<Match when={error instanceof XRPCError && error.error === 'NotFound'}>
								<div class="p-3">
									<EmbedRecordNotFound />
								</div>
							</Match>

							<Match when={error instanceof BlockedThreadError && error}>
								{(err) => {
									const viewer = () => err().view.author.viewer;

									return (
										<Switch>
											<Match when={viewer()?.blocking}>
												<div class="p-4">
													<div class="mb-4 text-sm">
														<p class="font-bold">This post is from a user you blocked</p>
														<p class="text-muted-fg">You need to unblock the user to view the post.</p>
													</div>

													<A
														href="/u/:uid/profile/:actor"
														params={{ uid: uid(), actor: actor() }}
														class={/* @once */ button({ color: 'primary' })}
													>
														View profile
													</A>
												</div>
											</Match>

											<Match when>
												<div class="p-3">
													<EmbedRecordNotFound />
												</div>
											</Match>
										</Switch>
									);
								}}
							</Match>
						</Switch>
					)}
				</Match>

				<Match when={thread()} keyed>
					{(data) => {
						const post = data.post;

						const record = () => post.record.value;
						const author = post.author;

						return (
							<>
								<Show when={data.ancestors} keyed>
									{(items) => {
										let overflowing = false;

										if (items.length > MAX_ANCESTORS) {
											overflowing = true;
											items = items.slice(-MAX_ANCESTORS) as any;
										}

										return (
											<>
												{overflowing && (
													<A
														href="/u/:uid/profile/:actor/post/:status"
														params={{
															uid: uid(),
															actor: getRepoId(items[0].uri),
															status: getRecordId(items[0].uri),
														}}
														class="flex h-10 items-center gap-3 px-4 hover:bg-hinted"
													>
														<div class="flex h-full w-10 justify-center">
															<div class="mt-3 border-l-2 border-dashed border-divider" />
														</div>
														<span class="text-sm text-accent">Show parent post</span>
													</A>
												)}

												{items.map((item) => {
													if ('$type' in item) {
														return (
															<div class="p-3">
																{item.$type === 'app.bsky.feed.defs#notFoundPost' ? (
																	<EmbedRecordNotFound />
																) : item.$type === 'app.bsky.feed.defs#blockedPost' ? (
																	<EmbedRecordBlocked
																		uid={uid()}
																		record={{
																			$type: 'app.bsky.embed.record#viewBlocked',
																			uri: item.uri,
																			blocked: item.blocked,
																			author: item.author,
																		}}
																	/>
																) : null}
															</div>
														);
													}

													return (
														<VirtualContainer key="posts" id={createPostKey(item.cid.value, false, true)}>
															<Post interactive uid={uid()} post={item} prev next />
														</VirtualContainer>
													);
												})}
											</>
										);
									}}
								</Show>

								<div ref={focusRef} class="scroll-m-16 px-4 pt-3">
									<div class="mb-1 flex items-center gap-3">
										<A
											href="/u/:uid/profile/:actor"
											params={{ uid: uid(), actor: author.did }}
											class="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted-fg hover:opacity-80"
										>
											<Show when={author.avatar.value}>
												{(avatar) => <img src={avatar()} class="h-full w-full" />}
											</Show>
										</A>

										<A
											href="/u/:uid/profile/:actor"
											params={{ uid: uid(), actor: author.did }}
											class="flex flex-col text-sm"
										>
											<span class="line-clamp-1 break-all font-bold hover:underline">
												{author.displayName.value || author.handle.value}
											</span>
											<span class="line-clamp-1 break-all text-muted-fg">@{author.handle.value}</span>
										</A>

										<div class="flex shrink-0 grow justify-end">
											<button
												onClick={() => {
													openModal(() => (
														<PostMenu
															uid={uid()}
															post={post}
															onTranslate={() => setSearchParams({ tl: 'y' }, { replace: true })}
														/>
													));
												}}
												class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base text-muted-fg hover:bg-secondary"
											>
												<MoreHorizIcon />
											</button>
										</div>
									</div>

									<Show when={post.$deleted.value}>
										<div class="mt-3 text-sm text-muted-fg">This post has been deleted.</div>
									</Show>

									<Show when={record().text}>
										<div class="mt-3 whitespace-pre-wrap break-words text-base">
											{post.$renderedContent()}
										</div>
									</Show>

									<Show when={searchParams.tl === 'y'}>
										<PostTranslation text={record().text} />
									</Show>

									<Show when={post.embed.value}>
										{(embed) => <Embed uid={uid()} embed={embed()} large />}
									</Show>

									<div class="my-3">
										<span class="text-sm text-muted-fg">
											{relformat.formatAbsWithTime(record().createdAt)}
										</span>
									</div>

									<hr class="border-divider" />

									<div class="flex flex-wrap gap-4 py-4 text-sm">
										<A
											href="/u/:uid/profile/:actor/post/:status/reposts"
											params={params}
											class="hover:underline"
										>
											<span class="font-bold">{comformat.format(post.repostCount.value)}</span>{' '}
											<span class="text-muted-fg">Reposts</span>
										</A>
										<A
											href="/u/:uid/profile/:actor/post/:status/likes"
											params={params}
											class="hover:underline"
										>
											<span class="font-bold">{comformat.format(post.likeCount.value)}</span>{' '}
											<span class="text-muted-fg">Likes</span>
										</A>
									</div>

									<hr class="border-divider" />

									<div class="flex h-13 items-center justify-around text-muted-fg">
										<UntypedAnchor
											href={`/u/${uid()}/compose?reply=${encodeURIComponent(post.uri)}`}
											class="flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary"
										>
											<ChatBubbleOutlinedIcon />
										</UntypedAnchor>

										<button
											class="flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary"
											classList={{
												'text-green-600': !!post.viewer.repost.value,
											}}
											onClick={() => {
												openModal(() => <PostRepostMenu uid={uid()} post={post} />);
											}}
										>
											<RepeatIcon />
										</button>

										<button
											class="group flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary"
											classList={{ 'is-active text-red-600': !!post.viewer.like.value }}
											onClick={() => favoritePost(uid(), post)}
										>
											<FavoriteOutlinedIcon class="group-[.is-active]:hidden" />
											<FavoriteIcon class="hidden group-[.is-active]:block" />
										</button>

										<button
											class="flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary"
											onClick={() => {
												openModal(() => <PostShareMenu post={post} />);
											}}
										>
											<ShareIcon />
										</button>
									</div>
								</div>

								<hr class="border-divider" />

								<For each={data.descendants}>
									{(slice) => {
										let overflowing = false;
										let items = slice.items;
										let len = items.length;

										if (len > MAX_DESCENDANTS) {
											overflowing = true;
											items = items.slice(0, MAX_DESCENDANTS) as any;
											len = MAX_DESCENDANTS;
										}

										return (
											<>
												{items.map((item, idx) => {
													if ('$type' in item) {
														return (
															<div class="border-b border-divider p-3">
																{item.$type === 'app.bsky.feed.defs#blockedPost' ? (
																	<EmbedRecordBlocked
																		uid={uid()}
																		record={{
																			$type: 'app.bsky.embed.record#viewBlocked',
																			uri: item.uri,
																			blocked: item.blocked,
																			author: item.author,
																		}}
																	/>
																) : null}
															</div>
														);
													}

													return (
														<VirtualContainer
															key="posts"
															id={createPostKey(item.cid.value, false, overflowing || idx !== len - 1)}
														>
															<Post
																interactive
																uid={uid()}
																post={item}
																prev
																next={overflowing || idx !== len - 1}
															/>
														</VirtualContainer>
													);
												})}

												{overflowing && (
													<A
														href="/u/:uid/profile/:actor/post/:status"
														params={{
															uid: uid(),
															actor: getRepoId(items[len - 1].uri),
															status: getRecordId(items[len - 1].uri),
														}}
														class="flex h-10 items-center gap-3 border-b border-divider px-4 hover:bg-hinted"
													>
														<div class="flex h-full w-10 justify-center">
															<div class="mb-3 border-l-2 border-dashed border-divider" />
														</div>
														<span class="text-sm text-accent">Continue thread</span>
													</A>
												)}
											</>
										);
									}}
								</For>

								<div class="flex h-13 items-center justify-center">
									<span class="text-sm text-muted-fg">End of thread</span>
								</div>
							</>
						);
					}}
				</Match>

				<Match when>
					<div class="flex h-13 items-center justify-center">
						<CircularProgress />
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default AuthenticatedPostPage;

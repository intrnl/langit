import { For, Match, Show, Switch } from 'solid-js';

import { A as UntypedAnchor, useLocation } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';

import { type XRPCError } from '~/api/rpc/xrpc-utils.ts';
import { type DID, getRecordId } from '~/api/utils.ts';

import { favoritePost } from '~/api/mutations/favorite-post.ts';
import { repostPost } from '~/api/mutations/repost-post.ts';
import { getPostThread, getPostThreadKey } from '~/api/queries/get-post-thread.ts';

import { A, useParams } from '~/router.ts';
import * as comformat from '~/utils/intl/comformatter.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import Embed from '~/components/Embed.tsx';
import EmbedRecordNotFound from '~/components/EmbedRecordNotFound.tsx';
import Post from '~/components/Post.tsx';
import { PostDropdown, PostRepostDropdown } from '~/components/PostDropdown.tsx';
import VirtualContainer, { createPostKey } from '~/components/VirtualContainer.tsx';

import FavoriteIcon from '~/icons/baseline-favorite.tsx';
import RepeatIcon from '~/icons/baseline-repeat.tsx';
import ShareIcon from '~/icons/baseline-share.tsx';
import ChatBubbleOutlinedIcon from '~/icons/outline-chat-bubble.tsx';
import FavoriteOutlinedIcon from '~/icons/outline-favorite.tsx';

const seen = new Set<string>();

const MAX_ANCESTORS = 10;
const MAX_DESCENDANTS = 4;

const formatter = new Intl.DateTimeFormat('en-US', {
	dateStyle: 'long',
	timeStyle: 'short',
});

const AuthenticatedPostPage = () => {
	const params = useParams('/u/:uid/profile/:actor/post/:status');
	const location = useLocation();

	const uid = () => params.uid as DID;
	const status = () => params.status;

	const threadQuery = createQuery({
		queryKey: () => getPostThreadKey(uid(), params.actor, status(), MAX_DESCENDANTS + 1, MAX_ANCESTORS + 1),
		queryFn: getPostThread,
		staleTime: 60_000,
		refetchOnMount: true,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
		retry: false,
	});

	const focusRef = (node: HTMLDivElement) => {
		requestAnimationFrame(() => {
			const data = threadQuery.data;
			const key = location.key;

			if (data && key && !seen.has(key)) {
				seen.add(key);
				node.scrollIntoView();
			}
		});
	};

	return (
		<div class="flex flex-col">
			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Post</p>
			</div>

			<Switch>
				<Match when={threadQuery.isLoading}>
					<div class="flex h-13 items-center justify-center">
						<CircularProgress />
					</div>
				</Match>

				<Match when={threadQuery.error} keyed>
					{(error) => (
						<Switch fallback={<div class="p-3 text-sm">Something went wrong.</div>}>
							<Match when={(error as XRPCError).error === 'NotFound'}>
								<div class="p-3">
									<EmbedRecordNotFound />
								</div>
							</Match>
						</Switch>
					)}
				</Match>

				<Match when={threadQuery.data} keyed>
					{(data) => {
						const post = data.post;

						const record = () => post.record.value;
						const author = post.author;

						const isReposted = () => !!post.viewer.repost.value;

						return (
							<>
								<Show when={data.ancestors} keyed>
									{(slice) => {
										let overflowing = false;
										let items = slice.items;

										if (items.length > MAX_ANCESTORS) {
											overflowing = true;
											items = items.slice(-MAX_ANCESTORS);
										}

										return (
											<>
												{overflowing ? (
													<A
														href="/u/:uid/profile/:actor/post/:status"
														params={{
															uid: uid(),
															actor: items[0].author.did,
															status: getRecordId(items[0].uri),
														}}
														class="flex h-10 items-center gap-3 px-4 hover:bg-hinted"
													>
														<div class="flex h-full w-12 justify-center">
															<div class="mt-3 border-l-2 border-dashed border-divider" />
														</div>
														<span class="text-sm text-accent">Show parent post</span>
													</A>
												) : data.parentNotFound ? (
													<div class="p-3">
														<EmbedRecordNotFound />
													</div>
												) : null}

												{items.map((item, idx) => (
													<VirtualContainer key="posts" id={/* @once */ createPostKey(item.cid, false, true)}>
														<Post interactive uid={uid()} post={item} prev={idx !== 0} next />
													</VirtualContainer>
												))}
											</>
										);
									}}
								</Show>

								<div ref={focusRef} class="scroll-m-13 px-4 pt-3">
									<div class="mb-1 flex items-center gap-3">
										<A
											href="/u/:uid/profile/:actor"
											params={{ uid: uid(), actor: author.did }}
											class="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted-fg hover:opacity-80"
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
											<PostDropdown post={post} uid={uid()} />
										</div>
									</div>

									<Show when={record().text}>
										<div class="mt-3 whitespace-pre-wrap break-words text-base">
											{post.$renderedContent(uid())}
										</div>
									</Show>

									<Show when={post.embed.value}>
										{(embed) => <Embed uid={uid()} embed={embed()} large />}
									</Show>

									<div class="my-3">
										<span class="text-sm text-muted-fg">
											{formatter.format(new Date(record().createdAt))}
										</span>
									</div>

									<hr class="border-divider" />

									<div class="flex flex-wrap gap-4 py-4 text-sm">
										<div>
											<span class="font-bold">{comformat.format(post.repostCount.value)}</span>{' '}
											<span class="text-muted-fg">Reposts</span>
										</div>
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

										<PostRepostDropdown uid={uid()} post={post} reposted={isReposted()} large />

										<button
											class="group flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary"
											classList={{ 'is-active text-red-600': !!post.viewer.like.value }}
											onClick={() => favoritePost(uid(), post)}
										>
											<FavoriteOutlinedIcon class="group-[.is-active]:hidden" />
											<FavoriteIcon class="hidden group-[.is-active]:block" />
										</button>

										<button class="flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary">
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
											items = items.slice(0, MAX_DESCENDANTS);
											len = MAX_DESCENDANTS;
										}

										return (
											<>
												{items.map((item, idx) => (
													<VirtualContainer
														key="posts"
														id={/* @once */ createPostKey(item.cid, false, overflowing || idx !== len - 1)}
													>
														<Post
															interactive
															uid={uid()}
															post={item}
															prev={idx !== 0}
															next={overflowing || idx !== len - 1}
														/>
													</VirtualContainer>
												))}

												{overflowing && (
													<A
														href="/u/:uid/profile/:actor/post/:status"
														params={{
															uid: uid(),
															actor: items[len - 1].author.did,
															status: getRecordId(items[len - 1].uri),
														}}
														class="flex h-10 items-center gap-3 border-b border-divider px-4 hover:bg-hinted"
													>
														<div class="flex h-full w-12 justify-center">
															<div class="mb-3 border-l-2 border-dashed border-divider" />
														</div>
														<span class="text-sm text-accent">Continue thread</span>
													</A>
												)}
											</>
										);
									}}
								</For>
							</>
						);
					}}
				</Match>
			</Switch>
		</div>
	);
};

export default AuthenticatedPostPage;

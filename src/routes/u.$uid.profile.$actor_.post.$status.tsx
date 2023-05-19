import { For, Match, Show, Switch } from 'solid-js';

import { useLocation } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';

import { getPostThread, getPostThreadKey } from '~/api/query.ts';
import { getPostId } from '~/api/utils.ts';

import { A, useParams } from '~/router.ts';
import * as comformat from '~/utils/intl/comformatter.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import Embed from '~/components/Embed.tsx';
import EmbedRecordNotFound from '~/components/EmbedRecordNotFound.tsx';
import Post from '~/components/Post.tsx';

import FavoriteIcon from '~/icons/baseline-favorite.tsx';
import MoreHorizIcon from '~/icons/baseline-more-horiz.tsx';
import RepeatIcon from '~/icons/baseline-repeat.tsx';
import ShareIcon from '~/icons/baseline-share.tsx';
import ChatBubbleOutlinedIcon from '~/icons/outline-chat-bubble.tsx';
import FavoriteOutlinedIcon from '~/icons/outline-favorite.tsx';

const seen = new Set<string>();

const MAX_ANCESTORS = 10;
const MAX_DESCENDANTS = 4;

const formatter = new Intl.DateTimeFormat('en', {
	dateStyle: 'long',
	timeStyle: 'short',
});

const AuthenticatedPostPage = () => {
	const params = useParams('/u/:uid/profile/:actor/post/:status');
	const location = useLocation();

	const uid = () => params.uid;

	const threadQuery = createQuery({
		queryKey: () => getPostThreadKey(params.uid, params.actor, params.status),
		queryFn: getPostThread,
		staleTime: 15_000,
		refetchOnMount: true,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
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
		<div class='flex flex-col'>
			<div class='bg-background flex items-center h-13 px-4 border-b border-divider sticky top-0 z-10'>
				<p class='font-bold text-base'>Post</p>
			</div>

			<Switch>
				<Match when={threadQuery.isLoading}>
					<div class='h-13 flex items-center justify-center'>
						<CircularProgress />
					</div>
				</Match>

				<Match when={threadQuery.data} keyed>
					{(data) => {
						const post = data.post;

						const record = () => post.record.value;
						const author = post.author;

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
												{overflowing
													? (
														<A
															href='/u/:uid/profile/:actor/post/:status'
															params={{
																uid: uid(),
																actor: items[0].author.did,
																status: getPostId(items[0].uri),
															}}
															class='h-10 flex items-center gap-3 px-4 hover:bg-hinted'
														>
															<div class='w-12 h-full flex justify-center'>
																<div class='border-l-2 border-divider border-dashed mt-3' />
															</div>
															<span class='text-accent text-sm'>Show parent post</span>
														</A>
													)
													: data.parentNotFound
													? (
														<div class='p-3'>
															<EmbedRecordNotFound />
														</div>
													)
													: null}

												{items.map((item, idx) => (
													<Post
														uid={uid()}
														post={item}
														prev={idx !== 0}
														next
													/>
												))}
											</>
										);
									}}
								</Show>

								<div ref={focusRef} class='px-4 pt-3 scroll-m-13'>
									<div class='flex items-center gap-3 mb-1'>
										<A
											href='/u/:uid/profile/:actor'
											params={{ uid: uid(), actor: author.did }}
											class='h-12 w-12 shrink-0 rounded-full bg-muted-fg overflow-hidden hover:opacity-80'
										>
											<Show when={author.avatar.value}>
												{(avatar) => <img src={avatar()} class='h-full w-full' />}
											</Show>
										</A>

										<A
											href='/u/:uid/profile/:actor'
											params={{ uid: uid(), actor: author.did }}
											class='flex flex-col text-sm'
										>
											<span class='font-bold break-all whitespace-pre-wrap break-words line-clamp-1 hover:underline'>
												{author.displayName.value}
											</span>
											<span class='text-muted-fg break-all whitespace-pre-wrap line-clamp-1'>
												@{author.handle.value}
											</span>
										</A>

										<div class='flex justify-end grow shrink-0'>
											<button class='flex items-center justify-center h-8 w-8 -my-1.5 -mx-2 rounded-full text-base text-muted-fg hover:bg-secondary'>
												<MoreHorizIcon />
											</button>
										</div>
									</div>

									<Show when={record().text}>
										{(text) => (
											<div class='text-base whitespace-pre-wrap break-words mt-3'>
												{text()}
											</div>
										)}
									</Show>

									<Show when={post.embed.value}>
										{(embed) => <Embed uid={uid()} embed={embed()} large />}
									</Show>

									<div class='my-3'>
										<span class='text-muted-fg text-sm'>
											{formatter.format(new Date(record().createdAt))}
										</span>
									</div>

									<hr class='border-divider' />

									<div class='flex flex-wrap gap-4 py-4 text-sm'>
										<div>
											<span class='font-bold'>{comformat.format(post.repostCount.value)}</span>{' '}
											<span class='text-muted-fg'>Reposts</span>
										</div>
										<div>
											<span class='font-bold'>{comformat.format(post.likeCount.value)}</span>{' '}
											<span class='text-muted-fg'>Likes</span>
										</div>
									</div>

									<hr class='border-divider' />

									<div class='h-13 flex items-center justify-around text-muted-fg'>
										<button class='flex items-center justify-center h-9 w-9 rounded-full text-xl hover:bg-secondary'>
											<ChatBubbleOutlinedIcon />
										</button>

										<button class='flex items-center justify-center h-9 w-9 rounded-full text-xl hover:bg-secondary'>
											<RepeatIcon />
										</button>

										<button class='flex items-center justify-center h-9 w-9 rounded-full text-xl hover:bg-secondary'>
											<FavoriteOutlinedIcon class='group-[.is-active]:hidden' />
											<FavoriteIcon class='hidden group-[.is-active]:block' />
										</button>

										<button class='flex items-center justify-center h-9 w-9 rounded-full text-xl hover:bg-secondary'>
											<ShareIcon />
										</button>
									</div>
								</div>

								<hr class='border-divider' />

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
													<Post
														uid={uid()}
														post={item}
														prev={idx !== 0}
														next={overflowing || idx !== len - 1}
													/>
												))}

												{overflowing && (
													<A
														href='/u/:uid/profile/:actor/post/:status'
														params={{
															uid: uid(),
															actor: items[len - 1].author.did,
															status: getPostId(items[len - 1].uri),
														}}
														class='h-10 flex items-center gap-3 px-4 border-b border-divider hover:bg-hinted'
													>
														<div class='w-12 h-full flex justify-center'>
															<div class='border-l-2 border-divider border-dashed mb-3' />
														</div>
														<span class='text-accent text-sm'>Continue thread</span>
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

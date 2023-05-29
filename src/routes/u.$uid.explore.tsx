import { For, Show, Suspense, SuspenseList, createMemo } from 'solid-js';

import { createQuery } from '@tanstack/solid-query';

import { preferences } from '~/api/preferences.ts';
import { getRecordId, getRepoId, type DID } from '~/api/utils.ts';

import { feedGenerators as feedGeneratorsCache } from '~/api/cache/feed-generators.ts';
import { getFeedGenerator, getFeedGeneratorKey } from '~/api/queries/get-feed-generator.ts';
import { getFeed, getFeedKey } from '~/api/queries/get-feed.ts';

import { A, useParams } from '~/router.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import Post from '~/components/Post.tsx';
import VirtualContainer, { createPostKey } from '~/components/VirtualContainer.tsx';
// import input from '~/styles/primitives/input.ts';

import SettingsIcon from '~/icons/baseline-settings.tsx';

const MAX_POSTS = 5;

const AuthenticatedExplorePage = () => {
	const params = useParams('/u/:uid/explore');

	const uid = () => params.uid as DID;

	const savedFeeds = createMemo(() => {
		return preferences.get(uid())?.savedFeeds || [];
	});

	return (
		<div class="flex flex-col pb-4">
			<div class="sticky top-0 z-20 flex h-13 items-center gap-4 border-b border-divider bg-background px-4">
				{/* <input placeholder="Search Bluesky" class={input()} /> */}
				<p class="grow text-base font-bold">Explore</p>

				<A
					href="/u/:uid/settings/explore"
					params={params}
					class="-mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base hover:bg-secondary"
				>
					<SettingsIcon />
				</A>
			</div>

			<SuspenseList revealOrder="forwards" tail="collapsed">
				<For
					each={savedFeeds()}
					fallback={
						<div>
							<p class="p-4 text-sm text-muted-fg">It's empty, how about adding some feeds here?</p>
						</div>
					}
				>
					{(feedUri) => {
						const feedQuery = createQuery({
							queryKey: () => getFeedGeneratorKey(uid(), feedUri),
							queryFn: getFeedGenerator,
							staleTime: 30_000,
							suspense: true,
							initialData: () => {
								const ref = feedGeneratorsCache[feedUri];
								return ref?.deref();
							},
						});

						const timelineQuery = createQuery({
							queryKey: () => getFeedKey(uid(), feedUri, MAX_POSTS),
							queryFn: getFeed,
							staleTime: 30_000,
							suspense: true,
						});

						const feed = () => feedQuery.data;

						return (
							<Suspense
								fallback={
									<div class="flex h-13 items-center justify-center border-divider">
										<CircularProgress />
									</div>
								}
							>
								<div class="border-b border-divider">
									<div class="sticky top-13 z-10 flex h-13 items-center gap-4 bg-background px-4">
										<div class="h-6 w-6 overflow-hidden rounded-md bg-muted-fg">
											<Show when={feed()?.avatar.value}>
												{(avatar) => <img src={avatar()} class="h-full w-full" />}
											</Show>
										</div>

										<span class="text-base font-bold">{feed()?.displayName.value}</span>
									</div>

									<For
										each={timelineQuery.data?.slices}
										fallback={
											<div>
												<p class="p-4 text-sm text-muted-fg">Looks like there's nothing here yet!</p>
											</div>
										}
									>
										{(slice) => {
											const items = slice.items;
											const len = items.length;

											return items.map((item, idx) => (
												<VirtualContainer
													key="posts"
													id={
														/* @once */ createPostKey(
															item.post.cid,
															(!!item.reply?.parent && idx === 0) || !!item.reason,
															idx !== len - 1,
														)
													}
												>
													<Post
														interactive
														uid={uid()}
														post={/* @once */ item.post}
														parent={/* @once */ item.reply?.parent}
														reason={/* @once */ item.reason}
														prev={idx !== 0}
														next={idx !== len - 1}
													/>
												</VirtualContainer>
											));
										}}
									</For>

									<Show when={timelineQuery.data && timelineQuery.data.slices.length > 0}>
										<A
											href="/u/:uid/profile/:actor/feed/:feed"
											params={{ uid: uid(), actor: getRepoId(feedUri), feed: getRecordId(feedUri) }}
											class="flex h-13 items-center px-4 text-sm text-accent hover:bg-hinted"
										>
											Show more
										</A>
									</Show>
								</div>
							</Suspense>
						);
					}}
				</For>
			</SuspenseList>
		</div>
	);
};

export default AuthenticatedExplorePage;

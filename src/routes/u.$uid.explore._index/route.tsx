import { For, Match, Show, Switch, batch, createMemo, createSignal, onCleanup, onMount } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery, type EnhancedResource } from '@intrnl/sq';
import { useNavigate } from '@solidjs/router';

import { type Collection, getCollectionId, getRecordId, getRepoId } from '~/api/utils.ts';

import type { SignalizedFeedGenerator } from '~/api/cache/feed-generators.ts';
import { type SignalizedList } from '~/api/cache/lists.ts';
import {
	getFeedGenerator,
	getFeedGeneratorKey,
	getInitialFeedGenerator,
} from '~/api/queries/get-feed-generator.ts';
import { getInitialListInfo, getListInfo, getListInfoKey } from '~/api/queries/get-list.ts';
import { type FeedPage, getTimeline, getTimelineKey } from '~/api/queries/get-timeline.ts';

import { getAccountPreferences } from '~/globals/preferences.ts';
import { generatePath, useParams } from '~/router.ts';
import { ResourceNotFoundError } from '~/utils/batch-fetch.ts';
import { Title } from '~/utils/meta.tsx';
import { assert } from '~/utils/misc.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import Post, { createPostKey } from '~/components/Post.tsx';
import SearchInput from '~/components/SearchInput.tsx';
import VirtualContainer from '~/components/VirtualContainer.tsx';

import RefreshIcon from '~/icons/baseline-refresh.tsx';
import SettingsIcon from '~/icons/baseline-settings.tsx';

const MAX_POSTS = 6;

const AuthenticatedExplorePage = () => {
	const params = useParams('/u/:uid/explore');
	const navigate = useNavigate();

	const uid = () => params.uid as DID;

	const savedFeeds = createMemo(() => {
		return getAccountPreferences(uid()).savedFeeds;
	});

	const [refetching, setRefetching] = createSignal(false);
	const refetches: (() => void | Promise<void>)[] = [];

	const refetchAll = () => {
		const promises: Promise<void>[] = [];

		for (let idx = 0, len = refetches.length; idx < len; idx++) {
			const refetch = refetches[idx];
			const promise = refetch();

			if (promise) {
				promises.push(promise);
			}
		}

		if (promises.length > 0) {
			setRefetching(true);
			Promise.all(promises).then(() => setRefetching(false));
		}
	};

	return (
		<div class="flex flex-col pb-4">
			<Title render="Explore / Langit" />

			<div class="sticky top-0 z-20 flex h-13 items-center gap-2 border-b border-divider bg-background px-4">
				<SearchInput
					onEnter={(next) => {
						if (next.trim()) {
							const path =
								generatePath('/u/:uid/explore/search', { uid: uid() }) +
								`?t=user&q=${encodeURIComponent(next)}`;

							navigate(path);
						}
					}}
				/>

				<Show when={savedFeeds()}>
					<button
						disabled={refetching()}
						onClick={refetchAll}
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg hover:bg-secondary disabled:pointer-events-none disabled:opacity-50"
					>
						<RefreshIcon />
					</button>
				</Show>

				<a
					link
					href={generatePath('/u/:uid/settings/explore', params)}
					class="-mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg hover:bg-secondary"
				>
					<SettingsIcon />
				</a>
			</div>
			<For
				each={savedFeeds()}
				fallback={
					<div>
						<p class="p-4 text-sm text-muted-fg">It's empty, how about adding some feeds here?</p>
					</div>
				}
			>
				{(uri) => {
					const actor = getRepoId(uri);
					const collection = getCollectionId(uri);
					const rkey = getRecordId(uri);

					let info: EnhancedResource<SignalizedFeedGenerator | SignalizedList>;
					let timeline: EnhancedResource<Collection<FeedPage>>;

					let refetchInfo: () => void | Promise<void>;
					let refetchTimeline: () => void | Promise<void>;

					let path: () => string;

					if (collection === 'app.bsky.feed.generator') {
						[info, { refetch: refetchInfo }] = createQuery({
							key: () => getFeedGeneratorKey(uid(), uri),
							fetch: getFeedGenerator,
							staleTime: 120_000,
							initialData: getInitialFeedGenerator,
						});

						[timeline, { refetch: refetchTimeline }] = createQuery({
							key: () => getTimelineKey(uid(), { type: 'feed', uri: uri }, MAX_POSTS),
							fetch: getTimeline,
							staleTime: 5_000,
							refetchOnMount: false,
							refetchOnWindowFocus: false,
						});

						path = () => {
							return generatePath('/u/:uid/profile/:actor/feed/:feed', {
								uid: uid(),
								actor: actor,
								feed: rkey,
							});
						};
					} else if (collection === 'app.bsky.graph.list') {
						[info, { refetch: refetchInfo }] = createQuery<SignalizedList, any>({
							key: () => getListInfoKey(uid(), uri),
							fetch: getListInfo,
							staleTime: 30_000,
							initialData: getInitialListInfo,
						});

						[timeline, { refetch: refetchTimeline }] = createQuery({
							key: () => getTimelineKey(uid(), { type: 'list', uri: uri }, MAX_POSTS),
							fetch: getTimeline,
							staleTime: 5_000,
							refetchOnMount: false,
							refetchOnWindowFocus: false,
						});

						path = () => {
							return generatePath('/u/:uid/profile/:actor/lists/:list/feed', {
								uid: uid(),
								actor: actor,
								list: rkey,
							});
						};
					} else {
						assert(false, `expected collection`);
					}

					const refetch = () => {
						refetchInfo();
						return refetchTimeline();
					};

					refetches.push(refetch);
					onCleanup(() => {
						const idx = refetches.indexOf(refetch);
						refetches.splice(idx, 1);
					});

					return (
						<Switch>
							<Match when={info.error} keyed>
								{(err) => {
									// This feed no longer exists, let's just remove them outright.
									// TODO: it would've been nice if we didn't do this, and instead
									// just alert the user that yeah, it's gone. but unfortunately
									// the way we're storing preferences right now isn't suitable.
									if (err instanceof ResourceNotFoundError) {
										onMount(() => {
											const $prefs = getAccountPreferences(uid());

											const pinned = new Set($prefs.pinnedFeeds);
											let saved = $prefs.savedFeeds || [];

											const savedIdx = saved.indexOf(uri);

											if (savedIdx !== -1) {
												saved = saved.slice();
												saved.splice(savedIdx, 1);
											}

											pinned.delete(uri);

											batch(() => {
												$prefs.savedFeeds = saved;
												$prefs.pinnedFeeds = saved.filter((uri) => pinned.has(uri));
											});
										});

										return null;
									}

									return (
										<div class="border-b border-divider p-4 text-sm">
											<p class="font-bold">Failed to load feed</p>
											<p class="text-muted-fg">{uri}</p>

											<p class="mt-2">{'' + err}</p>
										</div>
									);
								}}
							</Match>

							<Match when={info()}>
								<div class="border-b border-divider">
									<div class="sticky top-13 z-10 flex h-13 items-center gap-4 bg-background px-4">
										<div class="h-6 w-6 overflow-hidden rounded-md bg-muted-fg">
											<Show when={info()!.avatar.value}>
												{(avatar) => <img src={avatar()} class="h-full w-full" />}
											</Show>
										</div>

										<span class="text-base font-bold">{info()!.name.value}</span>
									</div>

									<Switch>
										<Match when={timeline.error}>
											<p class="p-4 text-sm text-muted-fg">Something went wrong with retrieving the feed</p>
										</Match>

										<Match when={timeline()}>
											<For
												each={timeline()!.pages[0].slices}
												fallback={
													<p class="p-4 text-sm text-muted-fg">Looks like there's nothing here yet!</p>
												}
											>
												{(slice) => {
													const items = slice.items;
													const len = items.length;

													return items.map((item, idx) => (
														<VirtualContainer
															estimateHeight={98.8}
															id={createPostKey(
																item.post.cid.value,
																(!!item.reply?.parent && idx === 0) || !!item.reason,
																idx !== len - 1,
															)}
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

											<Show when={timeline()?.pages[0].cid}>
												<a
													link
													href={path()}
													class="flex h-13 items-center px-4 text-sm text-accent hover:bg-hinted"
												>
													Show more
												</a>
											</Show>
										</Match>

										<Match when>
											<div class="flex h-13 items-center justify-center">
												<CircularProgress />
											</div>
										</Match>
									</Switch>
								</div>
							</Match>

							<Match when>
								<div class="flex h-13 items-center justify-center border-b border-divider">
									<CircularProgress />
								</div>
							</Match>
						</Switch>
					);
				}}
			</For>
		</div>
	);
};

export default AuthenticatedExplorePage;

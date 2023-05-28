import { For, Show, Suspense, SuspenseList, createMemo } from 'solid-js';

import { useNavigate } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';

import { feedGenerators as feedGeneratorsCache } from '~/api/cache/feed-generators.ts';
import { preferences } from '~/api/global.ts';
import { getRepoId, type DID, getRecordId } from '~/api/utils.ts';

import { getFeedGenerator, getFeedGeneratorKey } from '~/api/queries/get-feed-generator.ts';

import { A, useParams } from '~/router.ts';
import { isElementAltClicked, isElementClicked } from '~/utils/misc.ts';

import CircularProgress from '~/components/CircularProgress.tsx';

import AddIcon from '~/icons/baseline-add.tsx';
import DeleteIcon from '~/icons/baseline-delete.tsx';

const AuthenticatedExploreSettingsPage = () => {
	const params = useParams('/u/:uid/settings/explore');
	const navigate = useNavigate();

	const uid = () => params.uid as DID;

	const savedFeeds = createMemo(() => {
		return preferences.get(uid())?.savedFeeds || [];
	});

	const pinnedFeeds = createMemo(() => {
		return preferences.get(uid())?.pinnedFeeds || [];
	});

	return (
		<div class="flex flex-col pb-4">
			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold leading-5">Explore settings</p>
			</div>

			<p class="px-4 py-4 text-base font-bold leading-5">Feeds</p>
			<SuspenseList revealOrder="forwards" tail="collapsed">
				<For
					each={savedFeeds()}
					fallback={<div class="p-4 pt-2 text-sm text-muted-fg">You don't have any feeds yet, add one!</div>}
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

						const feed = () => feedQuery.data!;

						const toggleSave = () => {
							const prefs = preferences.get(uid());
							const saved = prefs?.savedFeeds;

							const idx = saved!.indexOf(feedUri);
							const next = saved!.slice();

							next.splice(idx, 1);
							preferences.merge(uid(), { savedFeeds: next });
						};

						const click = (ev: MouseEvent | KeyboardEvent) => {
							if (!isElementClicked(ev)) {
								return;
							}

							const uri = feedUri;
							const path = `/u/${uid()}/profile/${getRepoId(uri)}/feed/${getRecordId(uri)}`;

							if (isElementAltClicked(ev)) {
								open(path, '_blank');
							} else {
								navigate(path);
							}
						};

						return (
							<Suspense
								fallback={
									<div class="flex h-13 items-center justify-center border-divider">
										<CircularProgress />
									</div>
								}
							>
								<div
									tabindex={0}
									onClick={click}
									onAuxClick={click}
									onKeyDown={click}
									class="flex cursor-pointer flex-col gap-3 px-4 py-3 text-sm hover:bg-hinted"
								>
									<div class="flex items-center gap-4">
										<div class="h-9 w-9 overflow-hidden rounded-md bg-muted-fg">
											<Show when={feed()?.avatar.value}>
												{(avatar) => <img src={avatar()} class="h-full w-full" />}
											</Show>
										</div>

										<div class="grow">
											<p class="font-bold">{feed()?.displayName.value}</p>
											<p class="text-muted-fg">by @{feed()?.creator.handle.value}</p>
										</div>

										<div class="shrink-0">
											<button
												title="Remove feed"
												onClick={toggleSave}
												class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-xl hover:bg-secondary"
											>
												<DeleteIcon />
											</button>
										</div>
									</div>

									<Show when={feed()?.description.value}>
										<div class="whitespace-pre-wrap break-words text-sm">
											{feed()?.$renderedDescription(uid())}
										</div>
									</Show>

									<p class="text-muted-fg">Liked by {feed()?.likeCount.value} users</p>
								</div>
							</Suspense>
						);
					}}
				</For>
			</SuspenseList>

			<A
				href="/u/:uid/settings/explore/add"
				params={params}
				class="flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted"
			>
				<AddIcon class="text-2xl" />
				<span>Add new feed</span>
			</A>
		</div>
	);
};

export default AuthenticatedExploreSettingsPage;

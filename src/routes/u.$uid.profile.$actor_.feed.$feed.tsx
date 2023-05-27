import { Match, Show, Switch } from 'solid-js';

import { type InfiniteData, createInfiniteQuery, createQuery, useQueryClient } from '@tanstack/solid-query';

import { feedGenerators as feedGeneratorsCache } from '~/api/cache/feed-generators.ts';
import { type TimelinePage } from '~/api/models/timeline.ts';
import { type DID } from '~/api/utils.ts';

import {
	createFeedGeneratorUri,
	getFeedGenerator,
	getFeedGeneratorKey,
} from '~/api/queries/get-feed-generator.ts';
import { createFeedQuery, getFeedKey, getFeedLatest, getFeedLatestKey } from '~/api/queries/get-feed.ts';
import { getProfileDid, getProfileDidKey } from '~/api/queries/get-profile-did.ts';

import { useParams } from '~/router.ts';

import CircularProgress from '~/components/CircularProgress.tsx';

import AddIcon from '~/icons/baseline-add.tsx';
import Timeline from '~/components/Timeline';

const PAGE_SIZE = 30;

const AuthenticatedFeedPage = () => {
	const params = useParams('/u/:uid/profile/:actor/feed/:feed');

	const uid = () => params.uid as DID;
	const actor = () => params.actor;
	const feed = () => params.feed;

	const client = useQueryClient();

	const didQuery = createQuery({
		queryKey: () => getProfileDidKey(uid(), actor()),
		queryFn: getProfileDid,
		staleTime: 60_000,
	});

	const feedUri = () => createFeedGeneratorUri(didQuery.data!, feed());

	const infoQuery = createQuery({
		queryKey: () => getFeedGeneratorKey(uid(), feedUri()),
		queryFn: getFeedGenerator,
		staleTime: 30_000,
		initialData: () => {
			const uri = feedUri();
			const ref = feedGeneratorsCache[uri];

			return ref?.deref();
		},
		get enabled() {
			return !!didQuery.data;
		},
	});

	const timelineQuery = createInfiniteQuery({
		queryKey: () => getFeedKey(uid(), feedUri()),
		queryFn: createFeedQuery(PAGE_SIZE),
		getNextPageParam: (last) => last.length >= PAGE_SIZE && last.cursor,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		onSuccess: (data) => {
			const pages = data.pages;
			const length = pages.length;

			// if the page size is 1, that means we've just went through an initial
			// fetch, or a refetch, since our refetch process involves truncating the
			// timeline first.
			if (length === 1) {
				client.setQueryData(getFeedLatestKey(uid(), feedUri()), pages[0].cid);
			}

			// check if the last page is empty because of its slices being filtered
			// away, if so, fetch next page
			if (length > 0) {
				const last = pages[length - 1];

				if (last.cid && last.slices.length === 0) {
					timelineQuery.fetchNextPage();
				}
			}
		},
		get enabled() {
			return !!didQuery.data;
		},
	});

	const latestQuery = createQuery({
		queryKey: () => getFeedLatestKey(uid(), feedUri()),
		queryFn: getFeedLatest,
		staleTime: 10_000,
		get enabled() {
			if (!timelineQuery.data || timelineQuery.data.pages.length < 1 || !timelineQuery.data.pages[0].cid) {
				return false;
			}

			return true;
		},
	});

	return (
		<div class="flex flex-col">
			<div
				class="sticky top-0 z-10 flex h-13 items-center justify-end bg-background px-4"
				classList={{ 'border-b border-divider': !infoQuery.data }}
			>
				<Switch>
					<Match when={infoQuery.isLoading}>
						<p class="grow text-base font-bold">Feed</p>
					</Match>

					<Match when={infoQuery.data}>
						<button class="-mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base hover:bg-secondary">
							<AddIcon />
						</button>
					</Match>
				</Switch>
			</div>

			<Show when={infoQuery.data}>
				{(feed) => {
					const creator = () => feed().creator;

					return (
						<>
							<div class="flex flex-col gap-3 px-4 pb-4 pt-3">
								<div class="flex gap-4">
									<div class="mt-2 grow">
										<p class="break-words text-lg font-bold">{feed().displayName.value}</p>
										<p class="text-sm text-muted-fg">by @{creator().handle.value}</p>
									</div>

									<div class="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted-fg">
										<Show when={feed().avatar.value}>
											{(avatar) => <img src={avatar()} class="h-full w-full" />}
										</Show>
									</div>
								</div>

								<Show when={feed().description.value}>
									<div class="whitespace-pre-wrap break-words text-sm">
										{feed().$renderedDescription(uid())}
									</div>
								</Show>

								<p class="text-sm text-muted-fg">Liked by {feed().likeCount.value} users</p>
							</div>

							<hr class="sticky top-13 -mt-px border-divider" />
						</>
					);
				}}
			</Show>

			<Show when={!infoQuery.isError}>
				<Timeline
					uid={uid()}
					timelineQuery={timelineQuery}
					latestQuery={latestQuery}
					onLoadMore={() => timelineQuery.fetchNextPage()}
					onRefetch={() => {
						// we want to truncate the timeline here so that the refetch doesn't
						// also refetching however many pages of timeline that the user has
						// gone through.

						// this is the only way we can do that in tanstack query

						// ideally it would've been `{ pages: [], pageParams: [undefined] }`,
						// but unfortunately that breaks the `hasNextPage` check down below
						// and would also mean the user gets to see nothing for a bit.
						client.setQueryData(getFeedKey(uid(), feedUri()), (prev?: InfiniteData<TimelinePage>) => {
							if (prev) {
								return {
									pages: prev.pages.slice(0, 1),
									pageParams: prev.pageParams.slice(0, 1),
								};
							}

							return;
						});

						timelineQuery.refetch();
					}}
				/>
			</Show>
		</div>
	);
};

export default AuthenticatedFeedPage;

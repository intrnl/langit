import { For, Show, Suspense, createMemo } from 'solid-js';

import { useSearchParams } from '@solidjs/router';
import { type InfiniteData, createInfiniteQuery, createQuery, useQueryClient } from '@tanstack/solid-query';

import { type DID } from '~/api/utils.ts';

import { feedGenerators as feedGeneratorsCache } from '~/api/cache/feed-generators';
import { type TimelinePage } from '~/api/models/timeline.ts';
import {
	FOLLOWING_FEED,
	getFeed,
	getFeedKey,
	getFeedLatest,
	getFeedLatestKey,
} from '~/api/queries/get-feed.ts';
import { getFeedGenerator, getFeedGeneratorKey } from '~/api/queries/get-feed-generator.ts';

import { preferences } from '~/globals/preferences.ts';
import { useParams } from '~/router.ts';

import { Tab } from '~/components/Tab.tsx';
import Timeline from '~/components/Timeline.tsx';

const PAGE_SIZE = 30;

const FeedTab = (props: { uid: DID; uri: string; active: boolean; onClick?: () => void }) => {
	const feedUri = () => props.uri;

	const feedQuery = createQuery({
		queryKey: () => getFeedGeneratorKey(props.uid, feedUri()),
		queryFn: getFeedGenerator,
		staleTime: 30_000,
		suspense: true,
		initialData: () => {
			const ref = feedGeneratorsCache[feedUri()];
			return ref?.deref();
		},
	});

	return (
		<Tab<'button'> component="button" active={props.active} onClick={props.onClick}>
			{feedQuery.data?.displayName.value}
		</Tab>
	);
};

const Feed = (props: { uid: DID; uri: string }) => {
	const uid = () => props.uid;
	const feed = () => props.uri;

	const client = useQueryClient();

	const timelineQuery = createInfiniteQuery({
		queryKey: () => getFeedKey(uid(), feed(), PAGE_SIZE),
		queryFn: getFeed,
		getNextPageParam: (last) => last.cursor,
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
				client.setQueryData(getFeedLatestKey(uid(), feed()), pages[0].cid);
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
	});

	const latestQuery = createQuery({
		queryKey: () => getFeedLatestKey(uid(), feed()),
		queryFn: getFeedLatest,
		staleTime: 10_000,
		refetchInterval: 30_000,
		get enabled() {
			if (!timelineQuery.data || timelineQuery.data.pages.length < 1 || !timelineQuery.data.pages[0].cid) {
				return false;
			}

			return true;
		},
	});

	return (
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
				client.setQueryData(getFeedKey(uid(), feed(), PAGE_SIZE), (prev?: InfiniteData<TimelinePage>) => {
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
	);
};

const AuthenticatedHome = () => {
	const params = useParams('/u/:uid');
	const [searchParams, setSearchParams] = useSearchParams<{ feed?: string }>();

	const uid = () => params.uid as DID;
	const feed = () => searchParams.feed || FOLLOWING_FEED;

	const pinnedFeeds = createMemo(() => {
		const arr = preferences.get(uid())?.pinnedFeeds;
		return arr && arr.length > 0 ? arr : undefined;
	});

	return (
		<div class="flex grow flex-col">
			<div
				class="flex h-13 items-center px-4"
				classList={{ 'sticky top-0 z-10 border-b border-divider bg-background': !pinnedFeeds() }}
			>
				<p class="text-base font-bold">Home</p>
			</div>

			<Show when={pinnedFeeds()}>
				<Suspense fallback={<hr class="-mt-px border-divider" />}>
					<div class="sticky top-0 z-10 flex h-13 items-center overflow-x-auto border-b border-divider bg-background">
						<Tab<'button'>
							component="button"
							active={feed() === FOLLOWING_FEED}
							onClick={() => {
								setSearchParams({ feed: null }, { replace: true });
								window.scrollTo({ top: 0 });
							}}
						>
							Following
						</Tab>

						<For each={pinnedFeeds()}>
							{(uri) => (
								<FeedTab
									uid={uid()}
									uri={uri}
									active={feed() === uri}
									onClick={() => {
										setSearchParams({ feed: uri }, { replace: true });
										window.scrollTo({ top: 0 });
									}}
								/>
							)}
						</For>
					</div>
				</Suspense>
			</Show>

			<Show when={feed()} keyed>
				<Feed uid={uid()} uri={feed()} />
			</Show>
		</div>
	);
};

export default AuthenticatedHome;

import { For, Show } from 'solid-js';

import { InfiniteData, createInfiniteQuery, createQuery, useQueryClient } from '@tanstack/solid-query';

import { createTimelineQuery, getTimelineKey, getTimelineLatest, getTimelineLatestKey } from '~/api/query';
import { TimelinePage } from '~/models/timeline.ts';
import { useParams } from '~/router.ts';

import CircularProgress from '~/components/CircularProgress';
import Post from '~/components/Post.tsx';

const DEFAULT_ALGORITHM = 'reverse-chronological';
const PAGE_SIZE = 30;

const AuthenticatedHome = () => {
	const params = useParams('/u/:uid');

	const client = useQueryClient();

	const timelineQuery = createInfiniteQuery({
		queryKey: () => getTimelineKey(params.uid, DEFAULT_ALGORITHM),
		getNextPageParam: (last: TimelinePage) => last.cursor,
		queryFn: createTimelineQuery(PAGE_SIZE),
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		onSuccess: (data) => {
			const pages = data.pages;

			if (pages.length === 1) {
				client.setQueryData(getTimelineLatestKey(params.uid, DEFAULT_ALGORITHM), pages[0].cid);
			}
		},
	});

	const latestQuery = createQuery({
		queryKey: () => getTimelineLatestKey(params.uid, DEFAULT_ALGORITHM),
		queryFn: getTimelineLatest,
		staleTime: 10000,
		get enabled () {
			if (!timelineQuery.data || timelineQuery.data.pages.length < 1 || !timelineQuery.data.pages[0].cid) {
				return false;
			}

			return true;
		},
	});

	const getLatestCid = () => {
		return timelineQuery.data!.pages[0].cid;
	};

	return (
		<div class='flex flex-col'>
			<div class='bg-background flex items-center h-13 px-4 border-b border-divider sticky top-0 z-10'>
				<p class='font-bold text-base'>Home</p>
			</div>

			<Show when={timelineQuery.isInitialLoading || timelineQuery.isRefetching}>
				<div
					class='h-13 flex items-center justify-center border-divider'
					classList={{ 'border-b': timelineQuery.isRefetching }}
				>
					<CircularProgress />
				</div>
			</Show>

			<Show
				when={latestQuery.data &&
					!latestQuery.isFetching &&
					!timelineQuery.isRefetching &&
					latestQuery.data !== getLatestCid()}
			>
				<button
					onClick={() => {
						// we need to empty the query data first
						client.setQueryData(
							getTimelineKey(params.uid, DEFAULT_ALGORITHM),
							(prev?: InfiniteData<TimelinePage>) => {
								if (prev) {
									return {
										pages: prev.pages.slice(0, 1),
										pageParams: prev.pageParams.slice(0, 1),
									};
								}

								return;
							},
						);

						timelineQuery.refetch();
					}}
					class='text-sm text-accent flex items-center justify-center h-13 border-b border-divider hover:bg-hinted'
				>
					Show new posts
				</button>
			</Show>

			<div>
				<For each={timelineQuery.data ? timelineQuery.data.pages : []}>
					{(page) => (
						page.slices.map((slice) => {
							const items = slice.items;
							const len = items.length;

							return items.map((item, idx) => (
								<Post
									uid={params.uid}
									post={item.post.value}
									parent={item.reply?.parent.value}
									reason={item.reason}
									prev={idx !== 0}
									next={idx !== len - 1}
								/>
							));
						})
					)}
				</For>
			</div>

			<Show when={timelineQuery.isFetchingNextPage}>
				<div class='h-13 flex items-center justify-center'>
					<CircularProgress />
				</div>
			</Show>

			<Show when={timelineQuery.hasNextPage && !timelineQuery.isFetchingNextPage}>
				<button
					onClick={() => timelineQuery.fetchNextPage()}
					disabled={timelineQuery.isRefetching}
					class='text-sm text-accent flex items-center justify-center h-13 hover:bg-hinted disabled:pointer-events-none'
				>
					Show more posts
				</button>
			</Show>
		</div>
	);
};

export default AuthenticatedHome;

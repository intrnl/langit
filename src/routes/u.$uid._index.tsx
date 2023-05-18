import { InfiniteData, createInfiniteQuery, createQuery, useQueryClient } from '@tanstack/solid-query';

import { createTimelineQuery, getTimelineKey, getTimelineLatest, getTimelineLatestKey } from '~/api/query';
import { type TimelinePage } from '~/models/timeline.ts';

import { useParams } from '~/router.ts';

import Timeline from '~/components/Timeline';

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
			const length = pages.length;

			// if the page size is 1, that means we've just went through an initial
			// fetch, or a refetch, since our refetch process involves truncating the
			// timeline first.
			if (length === 1) {
				client.setQueryData(getTimelineLatestKey(params.uid, DEFAULT_ALGORITHM), pages[0].cid);
			}

			// check if the last page is empty because of its slices being filtered
			// away, if so, fetch next page
			if (length > 0) {
				const last = pages[length - 1];

				if (last.slices.length === 0) {
					timelineQuery.fetchNextPage();
				}
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

	return (
		<div class='flex flex-col'>
			<div class='bg-background flex items-center h-13 px-4 border-b border-divider sticky top-0 z-10'>
				<p class='font-bold text-base'>Home</p>
			</div>

			<Timeline
				uid={params.uid}
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
			/>
		</div>
	);
};

export default AuthenticatedHome;

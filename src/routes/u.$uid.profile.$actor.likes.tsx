import { type InfiniteData, createInfiniteQuery, createQuery, useQueryClient } from '@tanstack/solid-query';

import { TimelinePage } from '~/api/models/timeline.ts';
import {
	createProfileLikesQuery,
	getProfileLikesKey,
	getProfileLikesLatest,
	getProfileLikesLatestKey,
} from '~/api/queries/get-profile-likes.ts';

import { useParams } from '~/router.ts';

import Timeline from '~/components/Timeline.tsx';

const PAGE_SIZE = 25;

const AuthenticatedProfileTimelineLikesPage = () => {
	const params = useParams('/u/:uid/profile/:actor/likes');
	const client = useQueryClient();

	const uid = () => params.uid;
	const actor = () => params.actor;

	const timelineQuery = createInfiniteQuery({
		queryKey: () => getProfileLikesKey(uid(), actor()),
		queryFn: createProfileLikesQuery(PAGE_SIZE),
		getNextPageParam: (last: TimelinePage) => last.cursor,
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
				client.setQueryData(getProfileLikesLatestKey(uid(), actor()), pages[0].cid);
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
		queryKey: () => getProfileLikesLatestKey(uid(), actor()),
		queryFn: getProfileLikesLatest,
		staleTime: 10_000,
		get enabled () {
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
				client.setQueryData(
					getProfileLikesKey(uid(), actor()),
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
	);
};

export default AuthenticatedProfileTimelineLikesPage;

import { For, Show } from 'solid-js';

import { createInfiniteQuery, createQuery } from '@tanstack/solid-query';

import { multiagent } from '~/api/global.ts';
import { type BskyTimeline } from '~/api/types.ts';
import { TimelinePage, createTimelinePage } from '~/models/timeline.ts';
import { useParams } from '~/router.ts';

import Post from '~/components/Post.tsx';

const DEFAULT_ALGORITHM = 'reverse-chronological';

const PAGE_SIZE = 50;

const AuthenticatedHome = () => {
	const params = useParams('/u/:uid');

	const timelineQuery = createInfiniteQuery({
		queryKey: () => ['getTimeline', params.uid, DEFAULT_ALGORITHM] as const,
		getNextPageParam: (last: TimelinePage) => last.cursor,
		queryFn: async ({ queryKey, pageParam }) => {
			const [, uid, algorithm] = queryKey;

			const session = multiagent.accounts[uid].session;
			const agent = await multiagent.connect(uid);

			const response = await agent.rpc.get({
				method: 'app.bsky.feed.getTimeline',
				params: { algorithm, cursor: pageParam, limit: PAGE_SIZE },
			});

			const data = response.data as BskyTimeline;
			const page = createTimelinePage(data, session.did);

			return page;
		},
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	const latestQuery = createQuery({
		queryKey: () => ['getTimelineLatest', params.uid, DEFAULT_ALGORITHM] as const,
		queryFn: async ({ queryKey }) => {
			const [, uid, algorithm] = queryKey;

			const session = multiagent.accounts[uid].session;
			const agent = await multiagent.connect(uid);

			const response = await agent.rpc.get({
				method: 'app.bsky.feed.getTimeline',
				params: { algorithm, limit: PAGE_SIZE },
			});

			const data = response.data as BskyTimeline;
			const page = createTimelinePage(data, session.did);

			if (page.slices.length > 0) {
				return page.slices[0].items[0].post.peek().cid;
			}

			return null;
		},
		staleTime: 10000,
		get enabled () {
			if (
				!timelineQuery.data ||
				timelineQuery.data.pages.length < 1 ||
				timelineQuery.data.pages[0].slices.length < 1
			) {
				return false;
			}

			return true;
		},
	});

	const getLatestCid = () => {
		return timelineQuery.data!.pages[0].slices[0].items[0].post.peek().cid;
	};

	return (
		<div>
			<div class='bg-background flex items-center h-13 px-4 border-b border-divider sticky top-0 z-10'>
				<p class='font-bold text-base'>Home</p>
			</div>

			<div class='flex flex-col'>
				<Show when={latestQuery.data && latestQuery.data !== getLatestCid()}>
					<button
						onClick={() => timelineQuery.refetch()}
						class='text-sm text-accent flex items-center justify-center h-13 border-b border-divider hover:bg-hinted'
					>
						Show new posts
					</button>
				</Show>

				<For each={timelineQuery.data ? timelineQuery.data.pages : []}>
					{(page) => (
						page.slices.map((slice) => {
							const items = slice.items;
							const len = items.length;

							return (
								<div data-testid='timeline-slice'>
									{items.map((item, idx) => (
										<Post
											uid={params.uid}
											post={item.post.value}
											parent={item.reply?.parent.value}
											reason={item.reason}
											prev={idx !== 0}
											next={idx !== len - 1}
										/>
									))}
								</div>
							);
						})
					)}
				</For>

				<Show when={timelineQuery.isFetchingNextPage}>
					<div>
						Loading next page
					</div>
				</Show>

				<Show when={timelineQuery.hasNextPage && !timelineQuery.isFetchingNextPage}>
					<button
						onClick={() => timelineQuery.fetchNextPage()}
						class='text-sm text-accent flex items-center justify-center h-13 hover:bg-hinted'
					>
						Show more posts
					</button>
				</Show>
			</div>
		</div>
	);
};

export default AuthenticatedHome;

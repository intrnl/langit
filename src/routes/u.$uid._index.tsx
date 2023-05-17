import { For } from 'solid-js';

import { createInfiniteQuery } from '@tanstack/solid-query';

import { multiagent } from '~/api/global.ts';
import { type BskyTimeline } from '~/api/types.ts';
import { TimelinePage, createTimelinePage } from '~/models/timeline.ts';
import { useParams } from '~/router.ts';

import Post from '~/components/Post.tsx';

const DEFAULT_ALGORITHM = 'reverse-chronological';

const AuthenticatedHome = () => {
	const params = useParams('/u/:uid');

	const timelineQuery = createInfiniteQuery({
		queryKey: () => ['getTimeline', params.uid, DEFAULT_ALGORITHM] as const,
		getNextPageParam: (last: TimelinePage) => last.cursor,
		queryFn: async ({ queryKey, pageParam }) => {
			const [, uid, algorithm] = queryKey;

			const session = multiagent.accounts[params.uid].session;
			const agent = await multiagent.connect(uid);

			const response = await agent.rpc.get({
				method: 'app.bsky.feed.getTimeline',
				params: { algorithm: algorithm, cursor: pageParam },
			});

			const data = response.data as BskyTimeline;
			const page = createTimelinePage(data, session.did);

			return page;
		},
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	return (
		<div>
			<div class='bg-background flex items-center h-13 px-4 border-b border-divider sticky top-0 z-10'>
				<p class='font-bold text-base'>Home</p>
			</div>

			<div>
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
			</div>
		</div>
	);
};

export default AuthenticatedHome;

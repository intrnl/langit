import { For, Show } from 'solid-js';

import { type CreateInfiniteQueryResult, type CreateQueryResult } from '@tanstack/solid-query';

import { type TimelinePage } from '~/models/timeline';

import CircularProgress from '~/components/CircularProgress';
import Post from '~/components/Post.tsx';

export interface TimelineProps {
	uid: string;
	timelineQuery: CreateInfiniteQueryResult<TimelinePage, unknown>;
	latestQuery: CreateQueryResult<string | undefined, unknown>;
	onRefetch?: () => void;
	onLoadMore?: () => void;
}

const Timeline = (props: TimelineProps) => {
	// we're destructuring these props because we don't expect these to ever
	// change, they shouldn't.
	const { timelineQuery, latestQuery, onRefetch, onLoadMore } = props;

	const getLatestCid = () => {
		return timelineQuery.data?.pages[0].cid;
	};

	return (
		<>
			<Show when={timelineQuery.isInitialLoading || timelineQuery.isRefetching}>
				<div
					class='h-13 flex items-center justify-center border-divider'
					classList={{ 'border-b': timelineQuery.isRefetching }}
				>
					<CircularProgress />
				</div>
			</Show>

			<Show when={!timelineQuery.isRefetching && latestQuery.data && latestQuery.data !== getLatestCid()}>
				<button
					onClick={onRefetch}
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
									uid={props.uid}
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
					onClick={onLoadMore}
					disabled={timelineQuery.isRefetching}
					class='text-sm text-accent flex items-center justify-center h-13 hover:bg-hinted disabled:pointer-events-none'
				>
					Show more posts
				</button>
			</Show>
		</>
	);
};

export default Timeline;

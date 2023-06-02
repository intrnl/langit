import { For, Match, Switch } from 'solid-js';

import { type CreateInfiniteQueryResult, type CreateQueryResult } from '@tanstack/solid-query';

import { type DID } from '~/api/utils.ts';

import { type TimelinePage } from '~/api/models/timeline.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import Post from '~/components/Post.tsx';
import VirtualContainer, { createPostKey } from '~/components/VirtualContainer.tsx';

export interface TimelineProps {
	uid: DID;
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
			<Switch>
				<Match when={timelineQuery.isInitialLoading || timelineQuery.isRefetching}>
					<div
						class="flex h-13 items-center justify-center border-divider"
						classList={{ 'border-b': timelineQuery.isRefetching }}
					>
						<CircularProgress />
					</div>
				</Match>

				<Match when={latestQuery.data && latestQuery.data !== getLatestCid()}>
					<button
						onClick={onRefetch}
						class="flex h-13 items-center justify-center border-b border-divider text-sm text-accent hover:bg-hinted"
					>
						Show new posts
					</button>
				</Match>
			</Switch>

			<div>
				<For each={timelineQuery.data ? timelineQuery.data.pages : []}>
					{(page) =>
						page.slices.map((slice) => {
							const items = slice.items;
							const len = items.length;

							return items.map((item, idx) => (
								<VirtualContainer
									key="posts"
									id={
										/* @once */ createPostKey(
											item.post.cid,
											(!!item.reply?.parent && idx === 0) || !!item.reason,
											idx !== len - 1,
										)
									}
								>
									<Post
										interactive
										uid={props.uid}
										post={/* @once */ item.post}
										parent={/* @once */ item.reply?.parent}
										reason={/* @once */ item.reason}
										prev={idx !== 0}
										next={idx !== len - 1}
									/>
								</VirtualContainer>
							));
						})
					}
				</For>
			</div>

			<Switch>
				<Match when={timelineQuery.isFetchingNextPage}>
					<div class="flex h-13 items-center justify-center">
						<CircularProgress />
					</div>
				</Match>

				<Match when={timelineQuery.hasNextPage}>
					<button
						onClick={onLoadMore}
						disabled={timelineQuery.isRefetching}
						class="flex h-13 items-center justify-center text-sm text-accent hover:bg-hinted disabled:pointer-events-none"
					>
						Show more posts
					</button>
				</Match>

				<Match when={!timelineQuery.isInitialLoading}>
					<div class="flex h-13 items-center justify-center">
						<p class="text-sm text-muted-fg">End of list</p>
					</div>
				</Match>
			</Switch>
		</>
	);
};

export default Timeline;

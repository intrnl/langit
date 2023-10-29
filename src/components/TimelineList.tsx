import { For, Match, Show, Switch } from 'solid-js';

import type { DID } from '@externdefs/bluesky-client/atp-schema';

import type { FeedLatestResource, FeedPageCursor, FeedResource } from '~/api/queries/get-timeline.ts';

import { getCollectionCursor } from '~/api/utils.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import Post, { createPostKey } from '~/components/Post.tsx';
import VirtualContainer from '~/components/VirtualContainer.tsx';
import button from '~/styles/primitives/button.ts';

export interface TimelineListProps {
	uid: DID;
	timeline: FeedResource;
	latest?: FeedLatestResource;
	loading?: boolean;
	timelineDid?: DID;
	onRefetch: () => void;
	onLoadMore: (cursor: FeedPageCursor) => void;
}

const TimelineList = (props: TimelineListProps) => {
	// we're destructuring these props because we don't expect these to ever
	// change, they shouldn't.
	const { timeline, latest, onRefetch, onLoadMore } = props;

	const flattenedSlices = () => {
		return timeline()?.pages.flatMap((page) => page.slices);
	};

	return (
		<>
			<Switch>
				<Match when={props.loading || (timeline.loading && !timeline.refetchParam)}>
					<div
						class="flex h-13 items-center justify-center border-divider"
						classList={{ 'border-b': !!timeline() }}
					>
						<CircularProgress />
					</div>
				</Match>

				<Match
					when={(() => {
						const $latest = latest?.();
						return $latest && $latest.cid !== timeline()?.pages[0].cid;
					})()}
				>
					<button
						onClick={onRefetch}
						class="flex h-13 items-center justify-center border-b border-divider text-sm text-accent hover:bg-hinted"
					>
						Show new posts
					</button>
				</Match>
			</Switch>

			<div>
				<For each={flattenedSlices()}>
					{(slice) => {
						const items = slice.items;
						const len = items.length;

						return items.map((item, idx) => (
							<VirtualContainer
								estimateHeight={98.8}
								id={createPostKey(
									item.post.cid.value,
									(!!item.reply?.parent && idx === 0) || !!item.reason,
									idx !== len - 1,
								)}
							>
								<Post
									interactive
									uid={props.uid}
									post={/* @once */ item.post}
									parent={/* @once */ item.reply?.parent}
									reason={/* @once */ item.reason}
									prev={idx !== 0}
									next={idx !== len - 1}
									timelineDid={props.timelineDid}
								/>
							</VirtualContainer>
						));
					}}
				</For>
			</div>

			<Switch>
				<Match when={timeline.loading && timeline.refetchParam}>
					<div class="flex h-13 items-center justify-center">
						<CircularProgress />
					</div>
				</Match>

				<Match when={timeline.error}>
					<Show when={!timeline.loading}>
						<div class="flex flex-col items-center px-4 py-6 text-sm text-muted-fg">
							<p>Something went wrong</p>
							<p class="mb-4">{'' + timeline.error}</p>

							<button
								onClick={() => {
									const param = timeline.refetchParam;
									if (param != null) {
										onLoadMore(param);
									} else {
										onRefetch();
									}
								}}
								class={/* @once */ button({ color: 'primary' })}
							>
								Reload
							</button>
						</div>
					</Show>
				</Match>

				<Match when={getCollectionCursor(timeline(), 'cursor')}>
					{(cursor) => (
						<button
							onClick={() => onLoadMore(cursor())}
							disabled={timeline.loading}
							class="flex h-13 items-center justify-center text-sm text-accent hover:bg-hinted disabled:pointer-events-none"
						>
							Show more posts
						</button>
					)}
				</Match>

				<Match when={!timeline.loading && !props.loading}>
					<div class="flex h-13 items-center justify-center">
						<p class="text-sm text-muted-fg">End of list</p>
					</div>
				</Match>
			</Switch>
		</>
	);
};

export default TimelineList;

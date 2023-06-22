import { For, Match, Switch } from 'solid-js';
import { type JSX } from 'solid-js/jsx-runtime';

import { type CreateInfiniteQueryResult } from '@tanstack/solid-query';

import { type ListsPage } from '~/api/models/list.ts';
import { type DID } from '~/api/utils.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import ListItem from '~/components/ListItem.tsx';
import VirtualContainer from '~/components/VirtualContainer.tsx';

export interface ListListProps {
	uid: DID;
	listQuery: CreateInfiniteQueryResult<ListsPage, unknown>;
	fallback?: JSX.Element;
	disableEndMarker?: boolean;
	hideSubscribedBadge?: boolean;
	onLoadMore?: () => void;
}

const ListList = (props: ListListProps) => {
	// we're destructuring these props because we don't expect these to ever
	// change, they shouldn't.
	const { listQuery, onLoadMore } = props;

	return (
		<>
			<For each={listQuery.data?.pages}>
				{(page) => {
					return page.lists.map((list) => (
						<VirtualContainer key="list" id={list.uri}>
							<ListItem uid={props.uid} list={list} hideSubscribedBadge={props.hideSubscribedBadge} />
						</VirtualContainer>
					));
				}}
			</For>

			<Switch>
				<Match when={listQuery.isFetching}>
					<div class="flex h-13 items-center justify-center border-divider">
						<CircularProgress />
					</div>
				</Match>

				<Match when={listQuery.hasNextPage}>
					<button
						onClick={onLoadMore}
						disabled={listQuery.isRefetching}
						class="flex h-13 items-center justify-center text-sm text-accent hover:bg-hinted disabled:pointer-events-none"
					>
						Show more
					</button>
				</Match>

				<Match when={!listQuery.data?.pages[0]?.lists.length}>{props.fallback}</Match>

				<Match when={!props.disableEndMarker}>
					<div class="flex h-13 items-center justify-center">
						<p class="text-sm text-muted-fg">End of list</p>
					</div>
				</Match>
			</Switch>
		</>
	);
};

export default ListList;

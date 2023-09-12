import { For, Match, Switch } from 'solid-js';
import type { JSX } from 'solid-js/jsx-runtime';

import type { DID } from '@intrnl/bluesky-client/atp-schema';

import type { ProfileListsResource } from '~/api/queries/get-profile-lists.ts';

import { getCollectionCursor } from '~/api/utils.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import ListItem from '~/components/ListItem.tsx';
import VirtualContainer from '~/components/VirtualContainer.tsx';

export interface ListListProps {
	uid: DID;
	list: ProfileListsResource;
	fallback?: JSX.Element;
	disableEndMarker?: boolean;
	hideSubscribedBadge?: boolean;
	onLoadMore: (cursor: string) => void;
}

const ListList = (props: ListListProps) => {
	// we're destructuring these props because we don't expect these to ever
	// change, they shouldn't.
	const { list, onLoadMore } = props;

	return (
		<>
			<For each={list()?.pages}>
				{(page) => {
					return page.lists.map((list) => (
						<VirtualContainer key="list" id={list.uri} estimateHeight={88}>
							<ListItem uid={props.uid} list={list} hideSubscribedBadge={props.hideSubscribedBadge} />
						</VirtualContainer>
					));
				}}
			</For>

			<Switch>
				<Match when={list.loading}>
					<div class="flex h-13 items-center justify-center border-divider">
						<CircularProgress />
					</div>
				</Match>

				<Match when={getCollectionCursor(list(), 'cursor')}>
					{(cursor) => (
						<button
							onClick={() => onLoadMore(cursor())}
							class="flex h-13 items-center justify-center text-sm text-accent hover:bg-hinted disabled:pointer-events-none"
						>
							Show more
						</button>
					)}
				</Match>

				<Match when={!list()?.pages[0]?.lists.length}>{props.fallback}</Match>

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

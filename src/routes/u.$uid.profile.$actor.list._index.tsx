import { For, Match, Show, Switch } from 'solid-js';

import { useNavigate } from '@solidjs/router';
import { createInfiniteQuery } from '@tanstack/solid-query';

import { type DID, getRecordId, getRepoId } from '~/api/utils.ts';

import { getProfileLists, getProfileListsKey } from '~/api/queries/get-profile-lists.ts';

import { useParams } from '~/router.ts';
import { INTERACTION_TAGS, isElementAltClicked, isElementClicked } from '~/utils/misc.ts';

import CircularProgress from '~/components/CircularProgress.tsx';

const PAGE_SIZE = 30;

const AuthenticatedProfileListsPage = () => {
	const params = useParams('/u/:uid/profile/:actor/list');
	const navigate = useNavigate();

	const uid = () => params.uid as DID;

	const listQuery = createInfiniteQuery({
		queryKey: () => getProfileListsKey(uid(), params.actor, PAGE_SIZE),
		queryFn: getProfileLists,
		getNextPageParam: (last) => last.cursor,
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
	});

	return (
		<>
			<For each={listQuery.data?.pages}>
				{(page) => {
					return page.lists.map((list) => {
						const click = (ev: MouseEvent | KeyboardEvent) => {
							if (!isElementClicked(ev, INTERACTION_TAGS)) {
								return;
							}

							const uri = list.uri;
							const path = `/u/${uid()}/profile/${getRepoId(uri)}/list/${getRecordId(uri)}`;

							if (isElementAltClicked(ev)) {
								open(path, '_blank');
							} else {
								navigate(path);
							}
						};

						return (
							<div
								tabindex={0}
								onClick={click}
								onAuxClick={click}
								onKeyDown={click}
								role="button"
								class="flex gap-3 px-4 py-3 hover:bg-hinted"
							>
								<div class="mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted-fg">
									<Show when={list.avatar.value}>
										{(avatar) => <img src={avatar()} class="h-full w-full" />}
									</Show>
								</div>

								<div class="flex min-w-0 grow flex-col">
									<div class="text-sm">
										<span class="font-bold">{list.name.value}</span>

										<Show when={list.viewer.muted.value}>
											<span class="ml-2 rounded bg-muted px-1 py-0.5 align-[1px] text-xs font-medium">
												Subscribed
											</span>
										</Show>
									</div>
									<p class="text-sm text-muted-fg">Mute list by @{list.creator.handle.value}</p>

									<Show when={list.description.value}>
										<div class="mt-1 whitespace-pre-wrap break-words text-sm">
											{list.$renderedDescription(uid())}
										</div>
									</Show>
								</div>
							</div>
						);
					});
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
						onClick={() => listQuery.fetchNextPage()}
						disabled={listQuery.isRefetching}
						class="flex h-13 items-center justify-center text-sm text-accent hover:bg-hinted disabled:pointer-events-none"
					>
						Show more
					</button>
				</Match>

				<Match when>
					<div class="flex h-13 items-center justify-center">
						<p class="text-sm text-muted-fg">End of list</p>
					</div>
				</Match>
			</Switch>
		</>
	);
};

export default AuthenticatedProfileListsPage;

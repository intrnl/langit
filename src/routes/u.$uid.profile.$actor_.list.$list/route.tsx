import { For, Match, Show, Switch, createMemo } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';
import { Title } from '@solidjs/meta';
import { useNavigate } from '@solidjs/router';

import { getCollectionCursor } from '~/api/utils.ts';

import { getList, getListKey } from '~/api/queries/get-list.ts';

import { openModal } from '~/globals/modals.tsx';
import { A, useParams } from '~/router.ts';
import { INTERACTION_TAGS, isElementAltClicked, isElementClicked } from '~/utils/misc.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import button from '~/styles/primitives/button.ts';

import SubscribeListConfirmDialog from './SubscribeListConfirmDialog.tsx';

const PAGE_SIZE = 30;

const AuthenticatedListPage = () => {
	const params = useParams('/u/:uid/profile/:actor/list/:list');
	const navigate = useNavigate();

	const uid = () => params.uid as DID;

	const [listing, { refetch }] = createQuery({
		key: () => getListKey(uid(), params.actor, params.list, PAGE_SIZE),
		fetch: getList,
		refetchOnMount: false,
	});

	const list = createMemo(() => {
		return listing()?.pages[0].list;
	});

	const isSubscribed = () => list()?.viewer.muted.value;

	return (
		<div class="flex flex-col">
			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<Switch>
					<Match when={list()}>
						{(info) => (
							<>
								<Title>Feed ({info().name.value}) / Langit</Title>
								<p class="text-base font-bold">{info().name.value}</p>
							</>
						)}
					</Match>

					<Match when>
						<Title>Feed ({params.list})</Title>
						<p class="text-base font-bold">List</p>
					</Match>
				</Switch>
			</div>

			<Show when={list()}>
				{(list) => {
					const creator = () => list().creator;

					return (
						<>
							<div class="flex flex-col gap-3 border-b border-divider px-4 pb-4 pt-3">
								<div class="flex gap-4">
									<div class="mt-2 grow">
										<p class="break-words text-lg font-bold">{list().name.value}</p>
										<p class="text-sm text-muted-fg">
											<span>by </span>
											<A
												href="/u/:uid/profile/:actor"
												params={{ uid: uid(), actor: creator().did }}
												class="hover:underline"
											>
												@{creator().handle.value}
											</A>
										</p>
									</div>

									<div class="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted-fg">
										<Show when={list().avatar.value}>
											{(avatar) => <img src={avatar()} class="h-full w-full" />}
										</Show>
									</div>
								</div>

								<Show when={list().description.value}>
									<div class="whitespace-pre-wrap break-words text-sm">
										{list().$renderedDescription(uid())}
									</div>
								</Show>

								<div class="flex gap-2">
									<button
										onClick={() => {
											openModal(() => <SubscribeListConfirmDialog uid={uid()} list={list()} />);
										}}
										class={button({ color: isSubscribed() ? 'outline' : 'primary' })}
									>
										{isSubscribed() ? 'Unsubscribe list' : 'Subscribe list'}
									</button>
								</div>
							</div>
						</>
					);
				}}
			</Show>

			<For each={listing()?.pages}>
				{(page) => {
					return page.items.map((item) => {
						const profile = item.subject;

						const click = (ev: MouseEvent | KeyboardEvent) => {
							if (!isElementClicked(ev, INTERACTION_TAGS)) {
								return;
							}

							const path = `/u/${uid()}/profile/${profile.did}`;

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
								<div class="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted-fg">
									<Show when={profile.avatar.value}>
										{(avatar) => <img src={avatar()} class="h-full w-full" />}
									</Show>
								</div>

								<div class="flex min-w-0 grow flex-col gap-1">
									<div class="flex items-center justify-between gap-3">
										<div class="flex flex-col text-sm">
											<span class="line-clamp-1 break-all font-bold">
												{profile.displayName.value || profile.handle.value}
											</span>
											<span class="line-clamp-1 break-all text-muted-fg">@{profile.handle.value}</span>
										</div>
									</div>

									<Show when={profile.description.value}>
										<div class="line-clamp-3 break-words text-sm">{profile.$renderedDescription(uid())}</div>
									</Show>
								</div>
							</div>
						);
					});
				}}
			</For>

			<Switch>
				<Match when={listing.loading}>
					<div class="flex h-13 items-center justify-center border-divider">
						<CircularProgress />
					</div>
				</Match>

				<Match when={getCollectionCursor(listing(), 'cursor')}>
					{(cursor) => (
						<button
							onClick={() => refetch(true, cursor())}
							class="flex h-13 items-center justify-center text-sm text-accent hover:bg-hinted disabled:pointer-events-none"
						>
							Show more
						</button>
					)}
				</Match>

				<Match when={!!listing()}>
					<div class="flex h-13 items-center justify-center">
						<p class="text-sm text-muted-fg">End of list</p>
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default AuthenticatedListPage;

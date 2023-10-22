import { For, Match, Show, Switch, useContext } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { XRPCError } from '@intrnl/bluesky-client/xrpc-utils';
import { createQuery } from '@intrnl/sq';
import { useNavigate } from '@solidjs/router';

import { createListUri, getListMembers, getListMembersKey } from '~/api/queries/get-list.ts';

import { getCollectionCursor } from '~/api/utils.ts';

import { generatePath, useParams } from '~/router.ts';
import { INTERACTION_TAGS, isElementAltClicked, isElementClicked } from '~/utils/misc.ts';

import CircularProgress from '~/components/CircularProgress.tsx';

import { ListDidContext } from '../u.$uid.profile.$actor_.lists.$list/context.tsx';

const AuthenticatedListPage = () => {
	const [did] = useContext(ListDidContext)!;

	const navigate = useNavigate();
	const params = useParams('/u/:uid/profile/:actor/lists/:list');

	const uid = () => params.uid as DID;

	const [listing, { refetch }] = createQuery({
		key: () => {
			const $did = did();
			if ($did) {
				return getListMembersKey(uid(), createListUri($did, params.list));
			}
		},
		fetch: getListMembers,
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
	});

	return (
		<>
			<For each={listing()?.pages}>
				{(page) => {
					return page.members.map((member) => {
						const { subject, profile } = member;

						if (!profile) {
							return (
								<div class="flex items-center gap-3 px-4 py-3 text-sm">
									<div class="h-12 w-12 shrink-0 rounded-full bg-muted-fg"></div>

									<div class="text-muted-fg">
										<p>This user no longer exists</p>
										<p>{subject}</p>
									</div>
								</div>
							);
						}

						const click = (ev: MouseEvent | KeyboardEvent) => {
							if (!isElementClicked(ev, INTERACTION_TAGS)) {
								return;
							}

							const path = generatePath('/u/:uid/profile/:actor', { uid: uid(), actor: profile.did });

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
											<span dir="auto" class="line-clamp-1 break-all font-bold">
												{profile.displayName.value || profile.handle.value}
											</span>
											<span class="line-clamp-1 break-all text-muted-fg">@{profile.handle.value}</span>
										</div>
									</div>

									<Show when={profile.description.value}>
										<div class="line-clamp-3 break-words text-sm">{profile.$renderedDescription()}</div>
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

				<Match when={listing.error} keyed>
					{(err) => (
						<div class="grid grow place-items-center">
							<div class="max-w-sm p-4">
								<h1 class="mb-1 text-xl font-bold">Failed to load</h1>
								<p class="break-words text-sm">{err instanceof XRPCError ? err.message : '' + err}</p>
							</div>
						</div>
					)}
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
		</>
	);
};

export default AuthenticatedListPage;

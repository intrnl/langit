import { For, Match, Switch, useContext } from 'solid-js';

import type { DID } from '@externdefs/bluesky-client/atp-schema';
import { XRPCError } from '@externdefs/bluesky-client/xrpc-utils';
import { createQuery } from '@intrnl/sq';

import { createListUri, getListMembers, getListMembersKey } from '~/api/queries/get-list.ts';

import { getCollectionCursor } from '~/api/utils.ts';

import { useParams } from '~/router.ts';

import ProfileItem, { createProfileItemKey } from '~/components/lists/ProfileItem.tsx';
import CircularProgress from '~/components/CircularProgress.tsx';
import VirtualContainer from '~/components/VirtualContainer.tsx';

import { ListDidContext } from '../u.$uid.profile.$actor_.lists.$list/context.tsx';

const AuthenticatedListPage = () => {
	const [did] = useContext(ListDidContext)!;

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

						return (
							<VirtualContainer id={createProfileItemKey(profile)} estimateHeight={88}>
								<ProfileItem uid={uid()} profile={profile} />
							</VirtualContainer>
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

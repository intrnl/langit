import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';

import { getProfileLists, getProfileListsKey } from '~/api/queries/get-profile-lists.ts';
import { getSubscribedLists, getSubscribedListsKey } from '~/api/queries/get-subscribed-lists.ts';

import { useParams } from '~/router.ts';

import ListList from '~/components/ListList.tsx';

const PAGE_SIZE = 30;

const AuthenticatedListsModerationPage = () => {
	const params = useParams('/u/:uid/you/moderation/lists');

	const uid = () => params.uid as DID;

	const [myLists, { refetch: refetchMyLists }] = createQuery({
		key: () => getProfileListsKey(uid(), uid(), PAGE_SIZE),
		fetch: getProfileLists,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
	});

	const [subbedLists, { refetch: refetchSubbedLists }] = createQuery({
		key: () => getSubscribedListsKey(uid(), PAGE_SIZE),
		fetch: getSubscribedLists,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
	});

	return (
		<div class="flex flex-col">
			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">User lists</p>
			</div>

			<div class="flex flex-col">
				<div class="sticky top-13 flex items-center justify-between gap-4 bg-background px-4 py-4">
					<p class="text-base font-bold leading-5">Your user lists</p>
					{/* <button class="text-sm text-accent hover:underline">Create</button> */}
				</div>

				<ListList
					uid={uid()}
					list={myLists}
					fallback={
						<div class="p-4 pt-2 text-sm text-muted-fg">User lists you've created will show up here.</div>
					}
					disableEndMarker
					onLoadMore={(cursor) => refetchMyLists(true, cursor)}
				/>

				<div class="pt-2" />
			</div>

			<hr class="border-divider" />

			<div class="flex flex-col">
				<div class="sticky top-13 flex items-center justify-between gap-4 bg-background px-4 py-4">
					<p class="text-base font-bold leading-5">Subscribed user lists</p>
				</div>

				<ListList
					uid={uid()}
					list={subbedLists}
					fallback={
						<div class="p-4 pt-2 text-sm text-muted-fg">
							User lists created by other users will show up here.
						</div>
					}
					hideSubscribedBadge
					onLoadMore={(cursor) => refetchSubbedLists(true, cursor)}
				/>
			</div>
		</div>
	);
};

export default AuthenticatedListsModerationPage;

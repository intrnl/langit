import { createInfiniteQuery } from '@tanstack/solid-query';

import { getProfileLists, getProfileListsKey } from '~/api/queries/get-profile-lists.ts';
import { getSubscribedLists, getSubscribedListsKey } from '~/api/queries/get-subscribed-lists.ts';

import { type DID } from '~/api/utils.ts';

import { useParams } from '~/router.ts';

import ListList from '~/components/ListList.tsx';

const PAGE_SIZE = 30;

const AuthenticatedYouModerationPage = () => {
	const params = useParams('/u/:uid/you/moderation/mute-lists');

	const uid = () => params.uid as DID;

	const myListQuery = createInfiniteQuery({
		queryKey: () => getProfileListsKey(uid(), uid(), PAGE_SIZE),
		queryFn: getProfileLists,
		getNextPageParam: (last) => last.cursor,
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
	});

	const subbedListQuery = createInfiniteQuery({
		queryKey: () => getSubscribedListsKey(uid(), PAGE_SIZE, true),
		queryFn: getSubscribedLists,
		getNextPageParam: (last) => last.cursor,
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
	});

	return (
		<div class="flex flex-col">
			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Mute lists</p>
			</div>

			<div class="flex flex-col">
				<div class="sticky top-13 flex items-center justify-between gap-4 bg-background px-4 py-4">
					<p class="text-base font-bold leading-5">Your mute lists</p>
					{/* <button class="text-sm text-accent hover:underline">Create</button> */}
				</div>

				<ListList
					uid={uid()}
					listQuery={myListQuery}
					fallback={
						<div class="p-4 pt-2 text-sm text-muted-fg">Mute lists you've created will show up here.</div>
					}
					disableEndMarker
					onLoadMore={() => myListQuery.fetchNextPage()}
				/>

				<div class="pt-2" />
			</div>

			<hr class="border-divider" />

			<div class="flex flex-col">
				<div class="sticky top-13 flex items-center justify-between gap-4 bg-background px-4 py-4">
					<p class="text-base font-bold leading-5">Subscribed mute lists</p>
				</div>

				<ListList
					uid={uid()}
					listQuery={subbedListQuery}
					fallback={
						<div class="p-4 pt-2 text-sm text-muted-fg">
							Mute lists created by other users will show up here.
						</div>
					}
					hideSubscribedBadge
					onLoadMore={() => subbedListQuery.fetchNextPage()}
				/>
			</div>
		</div>
	);
};

export default AuthenticatedYouModerationPage;

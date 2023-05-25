import { Show, createMemo } from 'solid-js';

import { createInfiniteQuery } from '@tanstack/solid-query';

import { type DID } from '~/api/utils.ts';

import { createProfileFollowsQuery, getProfileFollowsKey } from '~/api/queries/get-profile-follows.ts';

import { useParams } from '~/router.ts';

import ProfileList from '~/components/ProfileList';

const PAGE_LIMIT = 30;

const AuthenticatedProfileFollowersPage = () => {
	const params = useParams('/u/:uid/profile/:actor/follows');

	const uid = () => params.uid as DID;

	const followsQuery = createInfiniteQuery({
		queryKey: () => getProfileFollowsKey(uid(), params.actor),
		queryFn: createProfileFollowsQuery(PAGE_LIMIT),
		getNextPageParam: (last) => last.cursor,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	const subject = createMemo(() => {
		return followsQuery.data?.pages[0].subject;
	});

	return (
		<div class='flex flex-col'>
			<div class='bg-background flex items-center h-13 px-4 border-b border-divider sticky top-0 z-10'>
				<div class='flex flex-col gap-0.5'>
					<p class='text-base leading-5 font-bold'>Follows</p>

					<Show when={subject()}>
						{(subject) => <p class='text-xs text-muted-fg'>@{subject().handle.value}</p>}
					</Show>
				</div>
			</div>

			<ProfileList
				uid={uid()}
				listQuery={followsQuery}
				onLoadMore={() => followsQuery.fetchNextPage()}
			/>
		</div>
	);
};

export default AuthenticatedProfileFollowersPage;

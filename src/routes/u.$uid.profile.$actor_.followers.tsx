import { Show, createMemo } from 'solid-js';

import { createInfiniteQuery } from '@tanstack/solid-query';

import {
	createFollowersQuery,
	createInfinitePlaceholder,
	createInitialFollowers,
	getFollowersKey,
} from '~/api/query.ts';
import { type BskyFollowersResponse } from '~/api/types.ts';

import { useParams } from '~/router.ts';

import CircularProgress from '~/components/CircularProgress.tsx';

const PAGE_LIMIT = 30;

const AuthenticatedProfileFollowersPage = () => {
	const params = useParams('/u/:uid/profile/:actor/followers');

	const followersQuery = createInfiniteQuery({
		queryKey: () => getFollowersKey(params.uid, params.actor),
		queryFn: createFollowersQuery(PAGE_LIMIT),
		getNextPageParam: (last: BskyFollowersResponse) => last.cursor,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		placeholderData: () => createInfinitePlaceholder(createInitialFollowers(params.actor)),
	});

	const subject = createMemo(() => {
		return followersQuery.data?.pages[0].subject;
	});

	return (
		<div class='flex flex-col'>
			<div class='bg-background flex items-center h-13 px-4 border-b border-divider sticky top-0 z-10'>
				<div class='flex flex-col gap-0.5'>
					<p class='text-base leading-5 font-bold'>Followers</p>

					<Show when={subject()}>
						{(subject) => <p class='text-xs text-muted-fg'>@{subject().handle}</p>}
					</Show>
				</div>
			</div>

			<Show when={followersQuery.isLoading}>
				<div class='h-13 flex items-center justify-center border-divider'>
					<CircularProgress />
				</div>
			</Show>
		</div>
	);
};

export default AuthenticatedProfileFollowersPage;

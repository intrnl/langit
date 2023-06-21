import { createInfiniteQuery } from '@tanstack/solid-query';

import { type DID } from '~/api/utils.ts';

import { getPostRepostedBy, getPostRepostedByKey } from '~/api/queries/get-post-reposted-by.ts';

import { useParams } from '~/router.ts';

import ProfileList from '~/components/ProfileList';

const PAGE_SIZE = 30;

const AuthenticatedPostRespostsPage = () => {
	const params = useParams('/u/:uid/profile/:actor/post/:status/reposts');

	const uid = () => params.uid as DID;

	const likesQuery = createInfiniteQuery({
		queryKey: () => getPostRepostedByKey(uid(), params.actor, params.status, PAGE_SIZE),
		queryFn: getPostRepostedBy,
		getNextPageParam: (last) => last.cursor,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	return (
		<div class="flex flex-col">
			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold leading-5">Reposts</p>
			</div>

			<ProfileList uid={uid()} listQuery={likesQuery} onLoadMore={() => likesQuery.fetchNextPage()} />
		</div>
	);
};

export default AuthenticatedPostRespostsPage;

import { createInfiniteQuery } from '@tanstack/solid-query';

import { type DID } from '~/api/utils.ts';

import { getProfileLists, getProfileListsKey } from '~/api/queries/get-profile-lists.ts';

import { useParams } from '~/router.ts';

import ListList from '~/components/ListList';

const PAGE_SIZE = 30;

const AuthenticatedProfileListsPage = () => {
	const params = useParams('/u/:uid/profile/:actor/list');

	const uid = () => params.uid as DID;

	const listQuery = createInfiniteQuery({
		queryKey: () => getProfileListsKey(uid(), params.actor, PAGE_SIZE),
		queryFn: getProfileLists,
		getNextPageParam: (last) => last.cursor,
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
	});

	return <ListList uid={uid()} listQuery={listQuery} onLoadMore={() => listQuery.fetchNextPage()} />;
};

export default AuthenticatedProfileListsPage;

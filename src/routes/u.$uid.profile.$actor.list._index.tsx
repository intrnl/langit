import { createQuery } from '~/lib/solid-query/index.ts';

import { type DID } from '~/api/utils.ts';

import { getProfileLists, getProfileListsKey } from '~/api/queries/get-profile-lists.ts';

import { useParams } from '~/router.ts';

import ListList from '~/components/ListList';

const PAGE_SIZE = 30;

const AuthenticatedProfileListsPage = () => {
	const params = useParams('/u/:uid/profile/:actor/list');

	const uid = () => params.uid as DID;

	const [lists, { refetch }] = createQuery({
		key: () => getProfileListsKey(uid(), uid(), PAGE_SIZE),
		fetch: getProfileLists,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
	});

	return <ListList uid={uid()} list={lists} onLoadMore={(cursor) => refetch(true, cursor)} />;
};

export default AuthenticatedProfileListsPage;

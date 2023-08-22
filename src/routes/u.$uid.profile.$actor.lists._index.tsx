import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';

import { getProfileLists, getProfileListsKey } from '~/api/queries/get-profile-lists.ts';

import { useParams } from '~/router.ts';

import ListList from '~/components/ListList';

const AuthenticatedProfileListsPage = () => {
	const params = useParams('/u/:uid/profile/:actor/lists');

	const uid = () => params.uid as DID;

	const [lists, { refetch }] = createQuery({
		key: () => getProfileListsKey(uid(), params.actor),
		fetch: getProfileLists,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
	});

	return <ListList uid={uid()} list={lists} onLoadMore={(cursor) => refetch(true, cursor)} />;
};

export default AuthenticatedProfileListsPage;

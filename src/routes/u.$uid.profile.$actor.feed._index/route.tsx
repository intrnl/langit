import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';

import { getProfileFeedsKey, getProfileFeeds } from '~/api/queries/get-profile-feeds.ts';

import { useParams } from '~/router.ts';

import FeedList from '~/components/FeedList.tsx';

const AuthenticatedProfileFeedsPage = () => {
	const params = useParams('/u/:uid/profile/:actor/feed');

	const uid = () => params.uid as DID;

	const [feeds, { refetch }] = createQuery({
		key: () => getProfileFeedsKey(uid(), params.actor),
		fetch: getProfileFeeds,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
	});

	return <FeedList uid={uid()} feeds={feeds} onLoadMore={(cursor) => refetch(true, cursor)} />;
};

export default AuthenticatedProfileFeedsPage;

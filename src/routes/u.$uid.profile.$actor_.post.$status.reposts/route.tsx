import type { DID } from '@externdefs/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';

import { getPostRepostedBy, getPostRepostedByKey } from '~/api/queries/get-post-reposted-by.ts';

import { useParams } from '~/router.ts';

import { ProfileFollowAccessory } from '~/components/lists/ProfileItem.tsx';
import ProfileList from '~/components/lists/ProfileList.tsx';

const PAGE_SIZE = 30;

const AuthenticatedPostRespostsPage = () => {
	const params = useParams('/u/:uid/profile/:actor/post/:status/reposts');

	const uid = () => params.uid as DID;

	const [reposts, { refetch }] = createQuery({
		key: () => getPostRepostedByKey(uid(), params.actor, params.status, PAGE_SIZE),
		fetch: getPostRepostedBy,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	return (
		<div class="flex flex-col">
			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold leading-5">Reposts</p>
			</div>

			<ProfileList
				uid={uid()}
				list={reposts}
				accessory={ProfileFollowAccessory}
				onLoadMore={(cursor) => refetch(true, cursor)}
			/>
		</div>
	);
};

export default AuthenticatedPostRespostsPage;

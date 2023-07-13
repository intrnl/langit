import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';
import { Title } from '@solidjs/meta';

import { getSelfBlocks, getSelfBlocksKey } from '~/api/queries/get-self-blocks.ts';

import { useParams } from '~/router.ts';

import ProfileList from '~/components/ProfileList.tsx';

const AuthenticatedBlockedUsersModerationPage = () => {
	const params = useParams('/u/:uid/you/moderation/muted');

	const uid = () => params.uid as DID;

	const [mutes, { refetch }] = createQuery({
		key: () => getSelfBlocksKey(uid(), 30),
		fetch: getSelfBlocks,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	return (
		<div class="flex flex-col">
			<Title>Blocked users / Langit</Title>

			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Blocked users</p>
			</div>

			<ProfileList uid={uid()} list={mutes} hideFollow onLoadMore={(cursor) => refetch(true, cursor)} />
		</div>
	);
};

export default AuthenticatedBlockedUsersModerationPage;

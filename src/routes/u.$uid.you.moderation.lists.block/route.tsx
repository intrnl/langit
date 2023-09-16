import type { DID } from '@intrnl/bluesky-client/atp-schema';

import { BLOCK_LIST } from '~/api/queries/get-subscribed-lists.ts';

import { useParams } from '~/router.ts';

import SubscribedLists from './SubscribedLists.tsx';

const AuthenticatedListsBlockModerationPage = () => {
	const params = useParams('/u/:uid/you/moderation/lists/block');

	return (
		<div class="flex flex-col">
			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Subscribed block lists</p>
			</div>

			<SubscribedLists uid={params.uid as DID} type={BLOCK_LIST} />
		</div>
	);
};

export default AuthenticatedListsBlockModerationPage;

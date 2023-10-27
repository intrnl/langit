import type { DID } from '@externdefs/bluesky-client/atp-schema';

import { MUTE_LIST } from '~/api/queries/get-subscribed-lists.ts';

import { useParams } from '~/router.ts';

import SubscribedLists from '../u.$uid.you.moderation.lists.block/SubscribedLists.tsx';

const AuthenticatedListsMuteModerationPage = () => {
	const params = useParams('/u/:uid/you/moderation/lists/mute');

	return (
		<div class="flex flex-col">
			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Subscribed mute lists</p>
			</div>

			<SubscribedLists uid={params.uid as DID} type={MUTE_LIST} />
		</div>
	);
};

export default AuthenticatedListsMuteModerationPage;

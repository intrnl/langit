import { Title } from '@solidjs/meta';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';

import { getSelfMutes, getSelfMutesKey } from '~/api/queries/get-self-mutes.ts';

import { A, useParams } from '~/router.ts';

import ProfileList from '~/components/ProfileList.tsx';

import AvTimerIcon from '~/icons/baseline-av-timer.tsx';

const AuthenticatedMutedUsersModerationPage = () => {
	const params = useParams('/u/:uid/you/moderation/muted');

	const uid = () => params.uid as DID;

	const [mutes, { refetch }] = createQuery({
		key: () => getSelfMutesKey(uid(), 30),
		fetch: getSelfMutes,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	return (
		<div class="flex flex-col">
			<Title>Muted users / Langit</Title>

			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Muted users</p>
			</div>

			<A
				href="/u/:uid/you/moderation/muted/temp"
				params={{ uid: uid() }}
				class="mt-2 flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted"
			>
				<AvTimerIcon class="text-2xl" />
				<span>Temporarily muted users</span>
			</A>

			<hr class="my-2 border-divider" />

			<ProfileList uid={uid()} list={mutes} hideFollow onLoadMore={(cursor) => refetch(true, cursor)} />
		</div>
	);
};

export default AuthenticatedMutedUsersModerationPage;

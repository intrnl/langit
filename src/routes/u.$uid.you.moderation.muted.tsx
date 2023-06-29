import { Title } from '@solidjs/meta';

import { createQuery } from '~/lib/solid-query/index.ts';

import { type DID } from '~/api/utils.ts';

import { getSelfMutes, getSelfMutesKey } from '~/api/queries/get-self-mutes.ts';

import { useParams } from '~/router.ts';

import ProfileList from '~/components/ProfileList.tsx';

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

			<ProfileList uid={uid()} list={mutes} hideFollow onLoadMore={(cursor) => refetch(true, cursor)} />
		</div>
	);
};

export default AuthenticatedMutedUsersModerationPage;

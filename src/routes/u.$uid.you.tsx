import { Show, createMemo } from 'solid-js';

import { createQuery } from '@tanstack/solid-query';

import { multiagent } from '~/api/global.ts';
import { getProfile, getProfileKey } from '~/api/query.ts';
import { Navigate, useParams } from '~/router.ts';

const AuthenticatedYouPage = () => {
	const params = useParams('/u/:uid');

	if (!multiagent.accounts || !multiagent.accounts[params.uid]) {
		return <Navigate href='/' />;
	}

	const handle = createMemo(() => {
		return multiagent.accounts[params.uid].session.handle;
	});

	const profileQuery = createQuery(() => getProfileKey(params.uid, handle()), getProfile);

	return (
		<div class='flex flex-col pb-4'>
			<Show when={profileQuery.data} keyed>
				{(profile) => (
					<div class='hover:bg-hinted'>
						<div class='aspect-banner bg-muted-fg'>
						</div>

						<div class='flex flex-col gap-3 p-4'>
							<div class='flex'>
								<div class='h-20 w-20 -mt-11 bg-muted-fg rounded-full overflow-hidden ring-2 ring-background'>
								</div>
							</div>

							<div>
								<p class='text-xl font-bold'>{profile.displayName}</p>
								<p class='text-sm text-muted-fg'>@{profile.handle}</p>
							</div>
						</div>
					</div>
				)}
			</Show>

			<hr class='border-divider mb-4' />
		</div>
	);
};

export default AuthenticatedYouPage;

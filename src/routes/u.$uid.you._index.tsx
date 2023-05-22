import { Show, createMemo } from 'solid-js';

import { createQuery } from '@tanstack/solid-query';

import { multiagent } from '~/api/global.ts';

import { getProfile, getProfileKey } from '~/api/queries/get-profile.ts';

import { A, Navigate, useParams } from '~/router.ts';

import ConfirmationNumberIcon from '~/icons/baseline-confirmation-number';

const AuthenticatedYouPage = () => {
	const params = useParams('/u/:uid');

	if (!multiagent.accounts || !multiagent.accounts[params.uid]) {
		return <Navigate href='/' />;
	}

	const did = createMemo(() => {
		return multiagent.accounts[params.uid].session.did;
	});

	const profileQuery = createQuery(() => getProfileKey(params.uid, did()), getProfile);

	return (
		<div class='flex flex-col pb-4'>
			<Show when={profileQuery.data}>
				{(profile) => (
					<A href='/u/:uid/profile/:actor' params={{ uid: params.uid, actor: did() }} class='hover:bg-hinted'>
						<div class='aspect-banner bg-muted-fg'>
						</div>

						<div class='flex flex-col gap-3 p-4'>
							<div class='flex'>
								<div class='h-20 w-20 -mt-11 bg-muted-fg rounded-full overflow-hidden ring-2 ring-background'>
									<Show when={profile().avatar.value}>
										{(avatar) => <img src={avatar()} class='h-full w-full' />}
									</Show>
								</div>
							</div>

							<div>
								<p class='text-xl font-bold'>{profile().displayName.value}</p>
								<p class='text-sm text-muted-fg'>@{profile().handle.value}</p>
							</div>
						</div>
					</A>
				)}
			</Show>

			<hr class='border-divider mb-4' />

			<A href='/u/:uid/you/invites' params={params} class='flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted'>
				<ConfirmationNumberIcon class='text-base' />

				<span>Invite codes</span>
			</A>
		</div>
	);
};

export default AuthenticatedYouPage;

import { Show } from 'solid-js';

import { createQuery } from '@tanstack/solid-query';

import { type DID } from '~/api/utils.ts';

import { getProfile, getProfileKey } from '~/api/queries/get-profile.ts';

import { A, useParams } from '~/router.ts';

import ConfirmationNumberIcon from '~/icons/baseline-confirmation-number.tsx';

const AuthenticatedYouPage = () => {
	const params = useParams('/u/:uid');

	const uid = () => params.uid as DID;

	const profileQuery = createQuery(() => getProfileKey(uid(), uid()), getProfile);

	return (
		<div class='flex flex-col pb-4'>
			<Show when={profileQuery.data}>
				{(profile) => (
					<A href='/u/:uid/profile/:actor' params={{ uid: uid(), actor: uid() }} class='hover:bg-hinted'>
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

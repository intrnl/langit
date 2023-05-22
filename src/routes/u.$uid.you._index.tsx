import { For, Match, Show, Switch, createMemo } from 'solid-js';

import { multiagent } from '~/api/global.ts';
import { type DID } from '~/api/utils.ts';

import { A, useNavigate, useParams } from '~/router.ts';

import AccountCircleIcon from '~/icons/baseline-account-circle';
import AddIcon from '~/icons/baseline-add.tsx';
import ConfirmationNumberIcon from '~/icons/baseline-confirmation-number.tsx';

const AuthenticatedYouPage = () => {
	const params = useParams('/u/:uid');
	const navigate = useNavigate();

	const uid = () => params.uid as DID;

	const accounts = createMemo(() => {
		const store = multiagent.accounts;
		return Object.values(store).sort((account) => account.did === uid() ? -1 : 1);
	});

	return (
		<div class='flex flex-col pb-4'>
			<div class='flex items-center h-13 px-4'>
				<p class='font-bold text-base'>Signed in as</p>
			</div>

			<For each={accounts()}>
				{(account) => {
					const profile = account.profile;

					const handleClick = (ev: MouseEvent) => {
						const path = ev.composedPath() as HTMLElement[];

						for (let idx = 0, len = path.length; idx < len; idx++) {
							const node = path[idx];
							const tag = node.localName;

							if (node == ev.currentTarget) {
								break;
							}

							if (tag === 'a' || tag === 'button') {
								return;
							}
						}

						navigate('/u/:uid', { params: { uid: account.did } });
					};

					return (
						<button onClick={handleClick} class='group text-left flex items-center gap-4 px-4 py-3 hover:bg-hinted'>
							<div class='h-12 w-12 shrink-0 rounded-full bg-hinted-fg overflow-hidden'>
								<Show when={profile?.avatar}>
									{(avatar) => <img src={avatar()} class='h-full w-full' />}
								</Show>
							</div>

							<Switch fallback={<div class='text-sm'>{account.did}</div>}>
								<Match when={profile}>
									{(profile) => (
										<div class='flex flex-col text-sm'>
											<span class='font-bold break-all whitespace-pre-wrap break-words line-clamp-1'>
												{profile().displayName || profile().handle}
											</span>
											<span class='text-muted-fg break-all whitespace-pre-wrap line-clamp-1'>
												@{profile().handle}
											</span>
										</div>
									)}
								</Match>
							</Switch>
						</button>
					);
				}}
			</For>

			<A href='/login' class='flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted'>
				<AddIcon class='text-2xl' />

				<span>Add new account</span>
			</A>

			<hr class='border-divider my-4' />

			<A
				href='/u/:uid/profile/:actor'
				params={{ uid: uid(), actor: uid() }}
				class='flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted'
			>
				<AccountCircleIcon class='text-2xl' />

				<span>Profile</span>
			</A>

			<A href='/u/:uid/you/invites' params={params} class='flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted'>
				<ConfirmationNumberIcon class='text-2xl' />

				<span>Invite codes</span>
			</A>
		</div>
	);
};

export default AuthenticatedYouPage;

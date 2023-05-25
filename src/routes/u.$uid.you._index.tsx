import { For, Match, Show, Switch, createMemo } from 'solid-js';

import { DropdownMenu } from '@kobalte/core';

import { useNavigate } from '@solidjs/router';

import { multiagent } from '~/api/global.ts';
import { type DID } from '~/api/utils.ts';

import { A, useParams } from '~/router.ts';
import { isElementAltClicked, isElementClicked } from '~/utils/misc.ts';

import { dropdownItem, dropdownMenu } from '~/styles/primitives/dropdown-menu.ts';

import AccountCircleIcon from '~/icons/baseline-account-circle.tsx';
import AddIcon from '~/icons/baseline-add.tsx';
import ConfirmationNumberIcon from '~/icons/baseline-confirmation-number.tsx';
import MoreHorizIcon from '~/icons/baseline-more-horiz.tsx';

const AuthenticatedYouPage = () => {
	const params = useParams('/u/:uid');
	const navigate = useNavigate();

	const uid = () => params.uid as DID;

	const asDefault = () => multiagent.active;

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
					const did = account.did;

					const handleClick = (ev: MouseEvent | KeyboardEvent) => {
						if (!isElementClicked(ev)) {
							return;
						}

						const path = `/u/${did}`;

						if (isElementAltClicked(ev)) {
							open(path, '_blank');
						}
						else {
							navigate(path);
						}
					};

					const handleLogout = async () => {
						await multiagent.logout(did);

						if (uid() === did) {
							navigate('/');
						}
					};

					return (
						<div
							tabindex={0}
							onClick={handleClick}
							onAuxClick={handleClick}
							onKeyDown={handleClick}
							class='group text-left flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-hinted'
						>
							<div class='h-12 w-12 shrink-0 rounded-full bg-hinted-fg overflow-hidden'>
								<Show when={profile?.avatar}>
									{(avatar) => <img src={avatar()} class='h-full w-full' />}
								</Show>
							</div>

							<Switch fallback={<div class='grow text-sm'>{did}</div>}>
								<Match when={profile}>
									{(profile) => (
										<div class='grow flex flex-col text-sm'>
											<span class='font-bold break-all whitespace-pre-wrap break-words line-clamp-1'>
												{profile().displayName || profile().handle}
											</span>
											<span class='text-muted-fg break-all whitespace-pre-wrap line-clamp-1'>
												@{profile().handle}
											</span>
											<Show when={did === asDefault()}>
												<span class='text-muted-fg'>
													Default account
												</span>
											</Show>
										</div>
									)}
								</Match>
							</Switch>

							<div>
								<DropdownMenu.Root placement='bottom-end'>
									<DropdownMenu.Trigger class='-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary'>
										<MoreHorizIcon />
									</DropdownMenu.Trigger>

									<DropdownMenu.Portal>
										<DropdownMenu.Content class={dropdownMenu()}>
											<DropdownMenu.Item
												as='button'
												onSelect={handleLogout}
												class={dropdownItem()}
											>
												Sign out
											</DropdownMenu.Item>

											<DropdownMenu.Item
												as='button'
												onSelect={() => (multiagent.active = did)}
												disabled={did === asDefault()}
												class={dropdownItem()}
											>
												Set as default
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Portal>
								</DropdownMenu.Root>
							</div>
						</div>
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
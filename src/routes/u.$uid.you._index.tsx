import { For, Show, createMemo, createSignal } from 'solid-js';

import { useNavigate } from '@solidjs/router';

import { multiagent } from '~/api/global.ts';
import { type MultiagentAccountData } from '~/api/multiagent.ts';
import { type DID } from '~/api/utils.ts';

import { A, useParams } from '~/router.ts';
import { isElementAltClicked, isElementClicked } from '~/utils/misc.ts';

import Dialog from '~/components/Dialog.tsx';
import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';
import * as menu from '~/styles/primitives/menu.ts';

import AccountCircleIcon from '~/icons/baseline-account-circle.tsx';
import AddIcon from '~/icons/baseline-add.tsx';
import ConfirmationNumberIcon from '~/icons/baseline-confirmation-number.tsx';
import MoreHorizIcon from '~/icons/baseline-more-horiz.tsx';

const AuthenticatedYouPage = () => {
	const params = useParams('/u/:uid');
	const navigate = useNavigate();

	const [toLogout, setToLogout] = createSignal<MultiagentAccountData>();

	const uid = () => params.uid as DID;

	const asDefault = () => multiagent.active;

	const accounts = createMemo(() => {
		const store = multiagent.accounts;
		return Object.values(store).sort((account) => (account.did === uid() ? -1 : 1));
	});

	return (
		<div class="flex flex-col pb-4">
			<div class="flex h-13 items-center px-4">
				<p class="text-base font-bold">Signed in as</p>
			</div>

			<For each={accounts()}>
				{(account) => {
					const profile = account.profile;
					const did = account.did;

					const [open, setOpen] = createSignal(false);

					const handleClick = (ev: MouseEvent | KeyboardEvent) => {
						if (!isElementClicked(ev)) {
							return;
						}

						const path = `/u/${did}`;

						if (isElementAltClicked(ev)) {
							window.open(path, '_blank');
						} else {
							navigate(path);
						}
					};

					return (
						<>
							<div
								tabindex={0}
								onClick={handleClick}
								onAuxClick={handleClick}
								onKeyDown={handleClick}
								class="group flex cursor-pointer items-center gap-4 px-4 py-3 text-left hover:bg-hinted"
							>
								<div class="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-hinted-fg">
									<Show when={profile?.avatar}>
										{(avatar) => <img src={avatar()} class="h-full w-full" />}
									</Show>
								</div>

								<Show when={profile} fallback={<div class="grow text-sm">{did}</div>}>
									{(profile) => (
										<div class="flex grow flex-col text-sm">
											<span class="line-clamp-1 break-all font-bold">
												{profile().displayName || profile().handle}
											</span>
											<span class="line-clamp-1 break-all text-muted-fg">@{profile().handle}</span>
											<Show when={did === asDefault()}>
												<span class="text-muted-fg">Default account</span>
											</Show>
										</div>
									)}
								</Show>

								<div>
									<button
										onClick={() => setOpen(true)}
										class="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary"
									>
										<MoreHorizIcon />
									</button>
								</div>
							</div>

							<Dialog open={open()} onClose={() => setOpen(false)}>
								<div class={/* @once */ menu.content()}>
									<div class={/* @once */ menu.title()}>{profile ? `@${profile.handle}` : did}</div>

									<button
										onClick={() => {
											setToLogout(account);
											setOpen(false);
										}}
										class={/* @once */ menu.item()}
									>
										Sign out
									</button>

									<button
										disabled={did === asDefault()}
										onClick={() => {
											multiagent.active = did;
											setOpen(false);
										}}
										class={/* @once */ menu.item()}
									>
										Set as default
									</button>

									<button
										onClick={() => {
											setOpen(false);
										}}
										class={/* @once */ menu.cancel()}
									>
										Cancel
									</button>
								</div>
							</Dialog>
						</>
					);
				}}
			</For>

			<A href="/login" class="flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted">
				<AddIcon class="text-2xl" />
				<span>Add new account</span>
			</A>

			<hr class="my-4 border-divider" />

			<A
				href="/u/:uid/profile/:actor"
				params={{ uid: uid(), actor: uid() }}
				class="flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted"
			>
				<AccountCircleIcon class="text-2xl" />
				<span>Profile</span>
			</A>

			<A
				href="/u/:uid/you/invites"
				params={params}
				class="flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted"
			>
				<ConfirmationNumberIcon class="text-2xl" />
				<span>Invite codes</span>
			</A>

			<Dialog open={toLogout() !== undefined}>
				<div class={/* @once */ dialog.content()}>
					<h1 class={/* @once */ dialog.title()}>Sign out?</h1>

					<p class="mt-3 text-sm">
						This will sign you out of{' '}
						{toLogout()!.profile ? `@${toLogout()!.profile!.handle}` : toLogout()!.did}, and you'll still be
						signed in to other accounts.
					</p>

					<div class={/* @once */ dialog.actions()}>
						<button
							onClick={() => {
								setToLogout(undefined);
							}}
							class={/* @once */ button({ color: 'ghost' })}
						>
							Cancel
						</button>
						<button
							onClick={() => {
								const did = toLogout()!.did;

								multiagent.logout(did);

								if (uid() === did) {
									navigate('/');
								}
							}}
							class={/* @once */ button({ color: 'primary' })}
						>
							Sign out
						</button>
					</div>
				</div>
			</Dialog>
		</div>
	);
};

export default AuthenticatedYouPage;

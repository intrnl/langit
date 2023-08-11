import { For, Show, createMemo } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { useNavigate } from '@solidjs/router';

import { multiagent } from '~/globals/agent.ts';
import { openModal } from '~/globals/modals.tsx';
import { A, useParams } from '~/router.ts';
import { INTERACTION_TAGS, isElementAltClicked, isElementClicked } from '~/utils/misc.ts';
import { isUpdateReady, updateSW } from '~/utils/service-worker.ts';

import AccountCircleIcon from '~/icons/baseline-account-circle.tsx';
import AddIcon from '~/icons/baseline-add.tsx';
import BlockIcon from '~/icons/baseline-block.tsx';
import BrightnessMediumIcon from '~/icons/baseline-brightness-medium.tsx';
import ConfirmationNumberIcon from '~/icons/baseline-confirmation-number.tsx';
import GroupOffIcon from '~/icons/baseline-group-off.tsx';
import LanguageIcon from '~/icons/baseline-language.tsx';
import MoreHorizIcon from '~/icons/baseline-more-horiz.tsx';
import PersonOffIcon from '~/icons/baseline-person-off.tsx';
import VisibilityIcon from '~/icons/baseline-visibility.tsx';

import AccountActionMenu from './AccountActionMenu.tsx';
import AppThemeMenu from './AppThemeMenu.tsx';

const AuthenticatedYouPage = () => {
	const params = useParams('/u/:uid');
	const navigate = useNavigate();

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

					const handleClick = (ev: MouseEvent | KeyboardEvent) => {
						if (!isElementClicked(ev, INTERACTION_TAGS)) {
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
								<div class="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted-fg">
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
										onClick={() => {
											openModal(() => <AccountActionMenu uid={uid()} account={account} />);
										}}
										class="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-secondary"
									>
										<MoreHorizIcon />
									</button>
								</div>
							</div>
						</>
					);
				}}
			</For>

			<A href="/login" class="flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted">
				<AddIcon class="text-xl" />
				<span>Add new account</span>
			</A>

			<hr class="my-4 border-divider" />

			<A
				href="/u/:uid/profile/:actor"
				params={{ uid: uid(), actor: uid() }}
				class="flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted"
			>
				<AccountCircleIcon class="text-xl" />
				<span>Profile</span>
			</A>

			<A
				href="/u/:uid/you/invites"
				params={params}
				class="flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted"
			>
				<ConfirmationNumberIcon class="text-xl" />
				<span>Invite codes</span>
			</A>

			<A
				href="/u/:uid/settings/content-languages"
				params={params}
				class="flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted"
			>
				<LanguageIcon class="text-xl" />
				<span>Content languages</span>
			</A>

			<button
				onClick={() => {
					openModal(() => <AppThemeMenu />);
				}}
				class="flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted"
			>
				<BrightnessMediumIcon class="text-xl" />
				<span>Application theme</span>
			</button>

			<Show when={isUpdateReady()}>
				<button
					onClick={() => {
						updateSW();
					}}
					class="flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted"
				>
					<span>Update application</span>
				</button>
			</Show>

			<hr class="mt-4 border-divider" />

			<div class="flex h-13 items-center px-4">
				<p class="text-base font-bold">Moderation</p>
			</div>

			<A
				href="/u/:uid/you/moderation/content-filter"
				params={params}
				class="flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted"
			>
				<VisibilityIcon class="text-xl" />
				<span>Content filtering</span>
			</A>

			<A
				href="/u/:uid/you/moderation/mute-lists"
				params={params}
				class="flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted"
			>
				<GroupOffIcon class="text-xl" />
				<span>Mute lists</span>
			</A>

			<A
				href="/u/:uid/you/moderation/muted"
				params={params}
				class="flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted"
			>
				<PersonOffIcon class="text-xl" />
				<span>Muted users</span>
			</A>

			<A
				href="/u/:uid/you/moderation/blocked"
				params={params}
				class="flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted"
			>
				<BlockIcon class="text-xl" />
				<span>Blocked users</span>
			</A>
		</div>
	);
};

export default AuthenticatedYouPage;

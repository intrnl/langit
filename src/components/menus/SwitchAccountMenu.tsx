import { For, Show } from 'solid-js';

import { useNavigate } from '@solidjs/router';

import { multiagent } from '~/api/global.ts';
import { type DID } from '~/api/utils.ts';

import { closeModal } from '~/globals/modals.tsx';

import * as menu from '~/styles/primitives/menu.ts';

export interface SwitchAccountMenuProps {
	uid: DID;
	redirect: (uid: DID) => string;
}

const SwitchAccountMenu = (props: SwitchAccountMenuProps) => {
	const navigate = useNavigate();

	const uid = () => props.uid;

	return (
		<div class={/* @once */ menu.content()}>
			<h1 class={/* @once */ menu.title()}>Choose account</h1>

			<For each={Object.values(multiagent.accounts).filter((account) => account.did !== uid())}>
				{(account) => {
					const profile = account.profile;
					const did = account.did;

					return (
						<button
							onClick={() => {
								const result = props.redirect(did);

								closeModal();
								navigate(result);
							}}
							class="flex items-center gap-4 px-4 py-3 text-left hover:bg-hinted"
						>
							<div class="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted-fg">
								<Show when={profile?.avatar}>{(avatar) => <img src={avatar()} class="h-full w-full" />}</Show>
							</div>

							<Show when={profile} fallback={<div class="grow text-sm">{did}</div>}>
								{(profile) => (
									<div class="flex grow flex-col text-sm">
										<p class="line-clamp-1 break-all font-bold">
											{profile().displayName || profile().handle}
										</p>
										<p class="line-clamp-1 break-all text-muted-fg">@{profile().handle}</p>
									</div>
								)}
							</Show>
						</button>
					);
				}}
			</For>

			<button onClick={closeModal} class={/* @once */ menu.cancel()}>
				Cancel
			</button>
		</div>
	);
};

export default SwitchAccountMenu;

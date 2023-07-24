import type { DID } from '@intrnl/bluesky-client/atp-schema';

import type { MultiagentAccountData } from '~/api/multiagent.ts';

import { multiagent } from '~/globals/agent.ts';
import { closeModal, openModal } from '~/globals/modals.tsx';

import * as menu from '~/styles/primitives/menu.ts';

import LogoutConfirmDialog from './LogoutConfirmDialog.tsx';

export interface AccountActionMenuProps {
	uid: DID;
	account: MultiagentAccountData;
}

const AccountActionMenu = (props: AccountActionMenuProps) => {
	const uid = () => props.uid;
	const account = () => props.account;

	const profile = () => account().profile;
	const did = () => account().did;

	return (
		<div class={/* @once */ menu.content()}>
			<div class={/* @once */ menu.title()}>{profile() ? `@${profile()!.handle}` : did()}</div>

			<button
				onClick={() => {
					closeModal();
					openModal(() => <LogoutConfirmDialog uid={uid()} account={account()} />);
				}}
				class={/* @once */ menu.item()}
			>
				Sign out
			</button>

			<button
				disabled={did() === multiagent.active}
				onClick={() => {
					multiagent.active = did();
					closeModal();
				}}
				class={/* @once */ menu.item()}
			>
				Set as default
			</button>

			<button onClick={closeModal} class={/* @once */ menu.cancel()}>
				Cancel
			</button>
		</div>
	);
};

export default AccountActionMenu;

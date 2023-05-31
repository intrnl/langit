import { multiagent } from '~/api/global.ts';
import { type MultiagentAccountData } from '~/api/multiagent.ts';
import { type DID } from '~/api/utils.ts';

import { closeModal, openModal } from '~/globals/modals.tsx';

import LogoutConfirmDialog from '~/components/dialogs/LogoutConfirmDialog.tsx';
import * as menu from '~/styles/primitives/menu.ts';

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
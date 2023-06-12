import { useNavigate } from '@solidjs/router';

import { type MultiagentAccountData } from '~/api/multiagent.ts';
import { type DID } from '~/api/utils.ts';

import { multiagent } from '~/globals/agent.ts';
import { closeModal } from '~/globals/modals.tsx';

import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';

export interface LogoutConfirmDialogProps {
	uid: DID;
	account: MultiagentAccountData;
}

const LogoutConfirmDialog = (props: LogoutConfirmDialogProps) => {
	const navigate = useNavigate();

	const uid = () => props.uid;
	const account = () => props.account;

	return (
		<div class={/* @once */ dialog.content()}>
			<h1 class={/* @once */ dialog.title()}>Sign out?</h1>

			<p class="mt-3 text-sm">
				This will sign you out of {account().profile ? `@${account().profile!.handle}` : account().did}, and
				you'll still be signed in to other accounts.
			</p>

			<div class={/* @once */ dialog.actions()}>
				<button onClick={closeModal} class={/* @once */ button({ color: 'ghost' })}>
					Cancel
				</button>
				<button
					onClick={() => {
						const did = account().did;

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
	);
};

export default LogoutConfirmDialog;

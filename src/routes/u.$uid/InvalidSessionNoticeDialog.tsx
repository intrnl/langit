import type { DID } from '@intrnl/bluesky-client/atp-schema';

import { multiagent } from '~/globals/agent.ts';
import { closeModal } from '~/globals/modals.tsx';
import { useNavigate } from '~/router.ts';

import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';

export interface InvalidSessionNoticeDialogProps {
	uid: DID;
}

const InvalidSessionNoticeDialog = (props: InvalidSessionNoticeDialogProps) => {
	const navigate = useNavigate();

	return (
		<div class={/* @once */ dialog.content()}>
			<h1 class={/* @once */ dialog.title()}>Session timeout</h1>

			<p class="mt-3 text-sm">
				Your account sign-in information is no longer valid, you would need to sign in again with your
				password to continue accessing your account.
			</p>

			<div class={/* @once */ dialog.actions()}>
				<button
					onClick={() => {
						const did = props.uid;
						multiagent.logout(did);

						closeModal();
						navigate('/login');
					}}
					class={/* @once */ button({ color: 'primary' })}
				>
					Sign out
				</button>
			</div>
		</div>
	);
};

export default InvalidSessionNoticeDialog;

import type { DID } from '@intrnl/bluesky-client/atp-schema';

import type { SignalizedProfile } from '~/api/cache/profiles.ts';
import { blockProfile } from '~/api/mutations/block-profile.ts';

import ConfirmDialog from '~/components/dialogs/ConfirmDialog.tsx';

export interface BlockConfirmDialogProps {
	uid: DID;
	profile: SignalizedProfile;
}

const BlockConfirmDialog = (props: BlockConfirmDialogProps) => {
	const uid = () => props.uid;
	const profile = () => props.profile;

	const isBlocked = () => profile().viewer.blocking.value;

	return ConfirmDialog({
		get title() {
			return `${isBlocked() ? 'Unblock' : 'Block'} @${profile().handle.value}?`;
		},
		get body() {
			return isBlocked()
				? `They will be allowed to view your posts, and interact with you.`
				: `They will not be able to view your posts, mention you, or otherwise interact with you, and you will not see posts or replies from @${
						profile().handle.value
				  }.`;
		},
		get confirmation() {
			return isBlocked() ? `Unblock` : `Block`;
		},
		onConfirm: () => {
			blockProfile(uid(), profile());
		},
	});
};

export default BlockConfirmDialog;

import { type DID } from '~/api/utils.ts';

import { type SignalizedProfile } from '~/api/cache/profiles.ts';
import { blockProfile } from '~/api/mutations/block-profile.ts';

import { closeModal } from '~/globals/modals.tsx';

import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';

export interface MuteConfirmDialogProps {
	uid: DID;
	profile: SignalizedProfile;
}

const BlockConfirmDialog = (props: MuteConfirmDialogProps) => {
	const uid = () => props.uid;
	const profile = () => props.profile;

	const isBlocked = () => profile().viewer.blocking.value;

	return (
		<div class={/* @once */ dialog.content()}>
			<h1 class={/* @once */ dialog.title()}>
				{isBlocked() ? 'Unblock' : 'Block'} @{profile().handle.value}?
			</h1>

			{isBlocked() ? (
				<p class="mt-3 text-sm">They will be allowed to view your posts, and interact with you.</p>
			) : (
				<p class="mt-3 text-sm">
					They will not be able to view your posts, mention you, or otherwise interact with you, and you will
					not see posts or replies from @{profile().handle.value}.
				</p>
			)}

			<div class={/* @once */ dialog.actions()}>
				<button
					onClick={() => {
						closeModal();
					}}
					class={/* @once */ button({ color: 'ghost' })}
				>
					Cancel
				</button>
				<button
					onClick={() => {
						blockProfile(uid(), profile());
						closeModal();
					}}
					class={/* @once */ button({ color: 'primary' })}
				>
					{isBlocked() ? 'Unblock' : 'Block'}
				</button>
			</div>
		</div>
	);
};

export default BlockConfirmDialog;

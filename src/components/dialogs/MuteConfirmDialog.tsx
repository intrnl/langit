import { type DID } from '~/api/utils.ts';

import { type SignalizedProfile } from '~/api/cache/profiles.ts';
import { muteProfile } from '~/api/mutations/mute-profile.ts';

import { closeModal } from '~/globals/modals.tsx';

import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';

export interface MuteConfirmDialogProps {
	uid: DID;
	profile: SignalizedProfile;
}

const MuteConfirmDialog = (props: MuteConfirmDialogProps) => {
	const uid = () => props.uid;
	const profile = () => props.profile;

	const isMuted = () => profile().viewer.muted.value;

	return (
		<div class={/* @once */ dialog.content()}>
			<h1 class={/* @once */ dialog.title()}>
				{isMuted() ? 'Unmute' : 'Mute'} @{profile().handle.value}?
			</h1>

			{isMuted() ? (
				<p class="mt-3 text-sm">Their posts will be allowed to show in your home timeline</p>
			) : (
				<p class="mt-3 text-sm">
					Their posts will no longer show up in your home timeline, but it will still allow them to see your
					posts and follow you.
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
						muteProfile(uid(), profile());
						closeModal();
					}}
					class={/* @once */ button({ color: 'primary' })}
				>
					{isMuted() ? 'Unmute' : 'Mute'}
				</button>
			</div>
		</div>
	);
};

export default MuteConfirmDialog;

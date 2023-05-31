import { type DID } from '~/api/utils.ts';

import { type SignalizedProfile } from '~/api/cache/profiles.ts';
import { followProfile } from '~/api/mutations/follow-profile.ts';

import { closeModal } from '~/globals/modals.tsx';

import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';

export interface UnfollowConfirmDialogProps {
	uid: DID;
	profile: SignalizedProfile;
}

const UnfollowConfirmDialog = (props: UnfollowConfirmDialogProps) => {
	const uid = () => props.uid;
	const profile = () => props.profile;

	return (
		<div class={/* @once */ dialog.content()}>
			<h1 class={/* @once */ dialog.title()}>Unfollow @{profile().handle.value}?</h1>

			<p class="mt-3 text-sm">Their posts will no longer show up in your home timeline.</p>

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
						followProfile(uid(), profile());
						closeModal();
					}}
					class={/* @once */ button({ color: 'primary' })}
				>
					Unfollow
				</button>
			</div>
		</div>
	);
};

export default UnfollowConfirmDialog;

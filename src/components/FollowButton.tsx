import { createSignal } from 'solid-js';

import { type DID } from '~/api/utils.ts';

import { type SignalizedProfile } from '~/api/cache/profiles.ts';
import { followProfile } from '~/api/mutations/follow-profile.ts';

import Dialog from '~/components/Dialog.tsx';
import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';

export interface FollowButtonProps {
	uid: DID;
	profile: SignalizedProfile;
}

const FollowButton = (props: FollowButtonProps) => {
	const uid = () => props.uid;
	const profile = () => props.profile;

	const isFollowing = () => profile().viewer.following.value;

	const [isConfirmOpen, setIsConfirmOpen] = createSignal(false);

	return (
		<>
			<button
				onClick={() => {
					if (isFollowing()) {
						setIsConfirmOpen(true);
					} else {
						followProfile(uid(), profile());
					}
				}}
				class={button({ color: isFollowing() ? 'outline' : 'primary' })}
			>
				{isFollowing() ? 'Following' : 'Follow'}
			</button>

			<Dialog open={isConfirmOpen()} onClose={() => setIsConfirmOpen(false)}>
				<div class={/* @once */ dialog.content()}>
					<h1 class={/* @once */ dialog.title()}>Unfollow @{profile().handle.value}?</h1>

					<p class="mt-3 text-sm">Their posts will no longer show up in your home timeline.</p>

					<div class={/* @once */ dialog.actions()}>
						<button
							onClick={() => {
								setIsConfirmOpen(false);
							}}
							class={/* @once */ button({ color: 'ghost' })}
						>
							Cancel
						</button>
						<button
							onClick={() => {
								followProfile(uid(), profile());
								setIsConfirmOpen(false);
							}}
							class={/* @once */ button({ color: 'primary' })}
						>
							Unfollow
						</button>
					</div>
				</div>
			</Dialog>
		</>
	);
};

export default FollowButton;

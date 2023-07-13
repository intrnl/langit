import type { DID } from '@intrnl/bluesky-client/atp-schema';

import type { SignalizedProfile } from '~/api/cache/profiles.ts';
import { followProfile } from '~/api/mutations/follow-profile.ts';

import { openModal } from '~/globals/modals.tsx';

import UnfollowConfirmDialog from '~/components/dialogs/UnfollowConfirmDialog.tsx';
import button from '~/styles/primitives/button.ts';

export interface FollowButtonProps {
	uid: DID;
	profile: SignalizedProfile;
}

const FollowButton = (props: FollowButtonProps) => {
	const uid = () => props.uid;
	const profile = () => props.profile;

	const isFollowing = () => profile().viewer.following.value;

	return (
		<button
			onClick={() => {
				if (isFollowing()) {
					openModal(() => <UnfollowConfirmDialog uid={uid()} profile={profile()} />);
				} else {
					followProfile(uid(), profile());
				}
			}}
			class={button({ color: isFollowing() ? 'outline' : 'primary' })}
		>
			{isFollowing() ? 'Following' : 'Follow'}
		</button>
	);
};

export default FollowButton;

import { Show } from 'solid-js';

import { type DID } from '~/api/utils.ts';

import { type SignalizedProfile } from '~/api/cache/profiles.ts';

import { multiagent } from '~/globals/agent.ts';
import { closeModal, openModal } from '~/globals/modals.tsx';

import BlockConfirmDialog from '~/components/dialogs/BlockConfirmDialog';
import MuteConfirmDialog from '~/components/dialogs/MuteConfirmDialog.tsx';
import SwitchAccountMenu from '~/components/menus/SwitchAccountMenu.tsx';
import * as menu from '~/styles/primitives/menu.ts';

import AccountCircleIcon from '~/icons/baseline-account-circle.tsx';
import BlockIcon from '~/icons/baseline-block';
import LaunchIcon from '~/icons/baseline-launch.tsx';
import VolumeOffIcon from '~/icons/baseline-volume-off.tsx';

export interface ProfileMenuProps {
	uid: DID;
	profile: SignalizedProfile;
}

const ProfileMenu = (props: ProfileMenuProps) => {
	const uid = () => props.uid;
	const profile = () => props.profile;

	const isMuted = () => profile().viewer.muted.value;
	const isBlocked = () => profile().viewer.blocking.value;

	return (
		<div class={/* @once */ menu.content()}>
			<button
				onClick={() => {
					open(`https://bsky.app/profile/${profile().did}`, '_blank');
					closeModal();
				}}
				class={/* @once */ menu.item()}
			>
				<LaunchIcon class="text-lg" />
				<span>Open in Bluesky app</span>
			</button>

			<Show when={Object.keys(multiagent.accounts).length > 1}>
				<button
					onClick={() => {
						closeModal();

						openModal(() => (
							<SwitchAccountMenu uid={uid()} redirect={(uid) => `/u/${uid}/profile/${profile().did}`} />
						));
					}}
					class={/* @once */ menu.item()}
				>
					<AccountCircleIcon class="text-lg" />
					<span>Open in another account...</span>
				</button>
			</Show>

			<button
				onClick={() => {
					closeModal();
					openModal(() => <MuteConfirmDialog uid={uid()} profile={profile()} />);
				}}
				class={/* @once */ menu.item()}
			>
				<VolumeOffIcon class="shrink-0 text-lg" />
				<span class="line-clamp-1 break-all">
					{isMuted() ? 'Unmute' : 'Mute'} @{profile().handle.value}
				</span>
			</button>

			<button
				onClick={() => {
					closeModal();
					openModal(() => <BlockConfirmDialog uid={uid()} profile={profile()} />);
				}}
				class={/* @once */ menu.item()}
			>
				<BlockIcon class="shrink-0 text-lg" />
				<span class="line-clamp-1 break-all">
					{isBlocked() ? 'Unblock' : 'Block'} @{profile().handle.value}
				</span>
			</button>

			<button onClick={closeModal} class={/* @once */ menu.cancel()}>
				Cancel
			</button>
		</div>
	);
};

export default ProfileMenu;

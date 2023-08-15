import { Show, batch, createMemo, lazy } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';

import type { SignalizedProfile } from '~/api/cache/profiles.ts';

import { multiagent } from '~/globals/agent.ts';
import { closeModal, openModal } from '~/globals/modals.tsx';
import { getAccountPreferences, isProfileTemporarilyMuted } from '~/globals/preferences.ts';

import BlockConfirmDialog from '~/components/dialogs/BlockConfirmDialog.tsx';
import ReportDialog, { REPORT_PROFILE } from '~/components/dialogs/ReportDialog.tsx';
import SwitchAccountMenu from '~/components/menus/SwitchAccountMenu.tsx';
import * as menu from '~/styles/primitives/menu.ts';

import AccountCircleIcon from '~/icons/baseline-account-circle.tsx';
import BlockIcon from '~/icons/baseline-block';
import LaunchIcon from '~/icons/baseline-launch.tsx';
import PlaylistAddIcon from '~/icons/baseline-playlist-add.tsx';
import RepeatIcon from '~/icons/baseline-repeat.tsx';
import ReportIcon from '~/icons/baseline-report.tsx';
import VolumeOffIcon from '~/icons/baseline-volume-off.tsx';

import AddProfileListDialog from './AddProfileListDialog.tsx';

export interface ProfileMenuProps {
	uid: DID;
	profile: SignalizedProfile;
}

const LazyMuteConfirmDialog = lazy(() => import('~/components/dialogs/MuteConfirmDialog.tsx'));

const ProfileMenu = (props: ProfileMenuProps) => {
	const uid = () => props.uid;
	const profile = () => props.profile;

	const prefs = createMemo(() => {
		return getAccountPreferences(uid());
	});

	const isMuted = () =>
		profile().viewer.muted.value || isProfileTemporarilyMuted(uid(), profile().did) !== null;
	const isBlocked = () => profile().viewer.blocking.value;

	const isRepostHidden = () => {
		const $prefs = prefs();
		return !!$prefs.pf_hideReposts?.includes(profile().did);
	};

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
					openModal(() => <AddProfileListDialog uid={uid()} profile={profile()} />);
				}}
				class={/* @once */ menu.item()}
			>
				<PlaylistAddIcon class="shrink-0 text-lg" />
				<span class="line-clamp-1 break-all">Add/remove @{profile().handle.value} from Lists</span>
			</button>

			<button
				onClick={() => {
					const $prefs = prefs();
					const $did = profile().did;

					const curr = $prefs.pf_hideReposts;

					if (isRepostHidden()) {
						if (curr) {
							const index = curr.indexOf($did);

							batch(() => {
								if (index !== -1) {
									curr.splice(index, 1);
								}

								if (curr.length < 1) {
									$prefs.pf_hideReposts = undefined;
								}
							});
						}
					} else {
						if (curr) {
							curr.push($did);
						} else {
							$prefs.pf_hideReposts = [$did];
						}
					}

					closeModal();
				}}
				class={/* @once */ menu.item()}
			>
				<RepeatIcon class="shrink-0 text-lg" />
				<span class="line-clamp-1 break-all">
					{isRepostHidden() ? 'Show' : 'Hide'} reposts from @{profile().handle.value}
				</span>
			</button>

			<button
				onClick={() => {
					closeModal();
					openModal(() => <LazyMuteConfirmDialog uid={uid()} profile={profile()} />);
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

			<button
				onClick={() => {
					closeModal();
					openModal(() => <ReportDialog uid={uid()} report={{ type: REPORT_PROFILE, did: profile().did }} />);
				}}
				class={/* @once */ menu.item()}
			>
				<ReportIcon class="shrink-0 text-lg" />
				<span class="line-clamp-1 break-all">Report user</span>
			</button>

			<button onClick={closeModal} class={/* @once */ menu.cancel()}>
				Cancel
			</button>
		</div>
	);
};

export default ProfileMenu;

import { Show } from 'solid-js';

import { multiagent } from '~/api/global.ts';
import { type DID, getRecordId } from '~/api/utils.ts';

import { type SignalizedPost } from '~/api/cache/posts.ts';

import { closeModal, openModal } from '~/globals/modals.tsx';

import MuteConfirmDialog from '~/components/dialogs/MuteConfirmDialog.tsx';
import SwitchAccountMenu from '~/components/menus/SwitchAccountMenu.tsx';
import * as menu from '~/styles/primitives/menu.ts';

import AccountCircleIcon from '~/icons/baseline-account-circle.tsx';
import GTranslateIcon from '~/icons/baseline-g-translate.tsx';
import LaunchIcon from '~/icons/baseline-launch.tsx';
import VolumeOffIcon from '~/icons/baseline-volume-off.tsx';

export interface PostMenuProps {
	uid: DID;
	post: SignalizedPost;
}

const PostMenu = (props: PostMenuProps) => {
	const uid = () => props.uid;
	const post = () => props.post;

	const author = () => post().author;

	const isMuted = () => author().viewer.muted.value;

	return (
		<div class={/* @once */ menu.content()}>
			<button
				onClick={() => {
					open(`https://bsky.app/profile/${author().did}/post/${getRecordId(post().uri)}`, '_blank');
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
							<SwitchAccountMenu
								uid={uid()}
								redirect={(uid) => `/u/${uid}/profile/${author().did}/post/${getRecordId(post().uri)}`}
							/>
						));
					}}
					class={/* @once */ menu.item()}
				>
					<AccountCircleIcon class="text-lg" />
					<span>Open in another account...</span>
				</button>
			</Show>

			<Show when={author().did !== uid()}>
				<button
					onClick={() => {
						closeModal();
						openModal(() => <MuteConfirmDialog uid={uid()} profile={author()} />);
					}}
					class={/* @once */ menu.item()}
				>
					<VolumeOffIcon class="shrink-0 text-lg" />
					<span class="line-clamp-1 break-all">
						{isMuted() ? 'Unmute' : 'Mute'} @{author().handle.value}
					</span>
				</button>
			</Show>

			<button
				onClick={() => {
					const text = post().record.value.text;
					const url = `https://translate.google.com/?sl=auto&text=${encodeURIComponent(text)}`;

					open(url, '_blank');
					closeModal();
				}}
				class={/* @once */ menu.item()}
			>
				<GTranslateIcon class="text-lg" />
				<span>Translate with Google Translate</span>
			</button>

			<button onClick={closeModal} class={/* @once */ menu.cancel()}>
				Cancel
			</button>
		</div>
	);
};

export default PostMenu;

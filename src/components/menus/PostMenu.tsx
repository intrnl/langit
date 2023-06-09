import { Show, lazy } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';

import { getRecordId } from '~/api/utils.ts';

import type { SignalizedPost } from '~/api/cache/posts.ts';

import { multiagent } from '~/globals/agent.ts';
import { closeModal, openModal } from '~/globals/modals.tsx';

import DeletePostConfirmDialog from '~/components/dialogs/DeletePostConfirmDialog.tsx';
import SwitchAccountMenu from '~/components/menus/SwitchAccountMenu.tsx';
import * as menu from '~/styles/primitives/menu.ts';

import AccountCircleIcon from '~/icons/baseline-account-circle.tsx';
import DeleteIcon from '~/icons/baseline-delete.tsx';
import LaunchIcon from '~/icons/baseline-launch.tsx';
import TranslateIcon from '~/icons/baseline-translate.tsx';
import VolumeOffIcon from '~/icons/baseline-volume-off.tsx';

export interface PostMenuProps {
	uid: DID;
	post: SignalizedPost;
	onTranslate: (ev: MouseEvent) => void;
}

const LazyMuteConfirmDialog = lazy(() => import('~/components/dialogs/MuteConfirmDialog.tsx'));

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
						openModal(() => <LazyMuteConfirmDialog uid={uid()} profile={author()} />);
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
				onClick={(ev) => {
					props.onTranslate(ev);
					closeModal();
				}}
				class={/* @once */ menu.item()}
			>
				<TranslateIcon class="text-lg" />
				<span>Translate</span>
			</button>

			<Show when={author().did === uid()}>
				<button
					onClick={() => {
						closeModal();
						openModal(() => <DeletePostConfirmDialog uid={uid()} post={post()} />);
					}}
					class={/* @once */ menu.item()}
				>
					<DeleteIcon class="text-lg" />
					<span>Delete</span>
				</button>
			</Show>

			<button onClick={closeModal} class={/* @once */ menu.cancel()}>
				Cancel
			</button>
		</div>
	);
};

export default PostMenu;

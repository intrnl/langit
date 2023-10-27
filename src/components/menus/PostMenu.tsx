import { Show, lazy } from 'solid-js';

import type { DID } from '@externdefs/bluesky-client/atp-schema';

import { getRecordId } from '~/api/utils.ts';

import type { SignalizedPost } from '~/api/cache/posts.ts';
import { deletePost } from '~/api/mutations/delete-post.ts';

import { multiagent } from '~/globals/agent.ts';
import { closeModal, replaceModal } from '~/globals/modals.tsx';
import { generatePath } from '~/router.ts';

import ConfirmDialog from '~/components/dialogs/ConfirmDialog.tsx';
import ReportDialog, { REPORT_POST } from '~/components/dialogs/ReportDialog.tsx';
import SwitchAccountMenu from '~/components/menus/SwitchAccountMenu.tsx';
import * as menu from '~/styles/primitives/menu.ts';

import AccountCircleIcon from '~/icons/baseline-account-circle.tsx';
import DeleteIcon from '~/icons/baseline-delete.tsx';
import LaunchIcon from '~/icons/baseline-launch.tsx';
import ReportIcon from '~/icons/baseline-report.tsx';
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
						replaceModal(() => (
							<SwitchAccountMenu
								uid={uid()}
								redirect={(uid) =>
									generatePath('/u/:uid/profile/:actor/post/:status', {
										uid: uid,
										actor: author().did,
										status: getRecordId(post().uri),
									})
								}
							/>
						));
					}}
					class={/* @once */ menu.item()}
				>
					<AccountCircleIcon class="text-lg" />
					<span>Open in another account...</span>
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

			<Show when={author().did !== uid()}>
				<button
					onClick={() => {
						replaceModal(() => <LazyMuteConfirmDialog uid={uid()} profile={author()} />);
					}}
					class={/* @once */ menu.item()}
				>
					<VolumeOffIcon class="shrink-0 text-lg" />
					<span class="line-clamp-1 break-all">
						{isMuted() ? 'Unmute' : 'Mute'} @{author().handle.value}
					</span>
				</button>

				<button
					onClick={() => {
						replaceModal(() => (
							<ReportDialog
								uid={uid()}
								report={{ type: REPORT_POST, uri: post().uri, cid: post().cid.value }}
							/>
						));
					}}
					class={/* @once */ menu.item()}
				>
					<ReportIcon class="shrink-0 text-lg" />
					<span class="line-clamp-1 break-all">Report post</span>
				</button>
			</Show>

			<Show when={author().did === uid()}>
				<button
					onClick={() => {
						replaceModal(() => (
							<ConfirmDialog
								title={`Delete post?`}
								body={`This can't be undone, the post will be deleted from your profile, the timeline of any users that follow you, and from search results.`}
								confirmation={`Delete`}
								onConfirm={() => deletePost(uid(), post())}
							/>
						));
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

import { Show } from 'solid-js';

import { multiagent } from '~/api/global.ts';
import { type SignalizedPost } from '~/api/cache/posts.ts';
import { type DID, getRecordId } from '~/api/utils.ts';

import { closeModal, openModal } from '~/globals/modals.tsx';

import SwitchAccountMenu from '~/components/menus/SwitchAccountMenu.tsx';
import * as menu from '~/styles/primitives/menu.ts';

export interface PostMenuProps {
	uid: DID;
	post: SignalizedPost;
}

const PostMenu = (props: PostMenuProps) => {
	const uid = () => props.uid;
	const post = () => props.post;

	const author = () => post().author;

	return (
		<div class={/* @once */ menu.content()}>
			<button
				onClick={() => {
					open(`https://bsky.app/profile/${author().did}/post/${getRecordId(post().uri)}`, '_blank');
					closeModal();
				}}
				class={/* @once */ menu.item()}
			>
				Open in Bluesky app
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
					Open in another account...
				</button>
			</Show>

			<button onClick={closeModal} class={/* @once */ menu.cancel()}>
				Cancel
			</button>
		</div>
	);
};

export default PostMenu;

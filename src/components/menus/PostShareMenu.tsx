import { type SignalizedPost } from '~/api/cache/posts.ts';
import { getRecordId } from '~/api/utils';

import { closeModal } from '~/globals/modals.tsx';

import * as menu from '~/styles/primitives/menu.ts';

import ContentCopyIcon from '~/icons/baseline-content-copy.tsx';
import LinkIcon from '~/icons/baseline-link.tsx';

export interface PostShareMenuProps {
	post: SignalizedPost;
}

const PostShareMenu = (props: PostShareMenuProps) => {
	const post = () => props.post;

	return (
		<div class={/* @once */ menu.content()}>
			<button
				onClick={() => {
					const protocol = location.protocol;
					const host = location.host;

					const author = post().author.did;
					const status = getRecordId(post().uri);

					navigator.clipboard.writeText(`${protocol}//${host}/r/profile/${author}/post/${status}`);
					closeModal();
				}}
				class={/* @once */ menu.item()}
			>
				<LinkIcon class="text-lg" />
				<span>Copy link to post</span>
			</button>

			<button
				onClick={() => {
					navigator.clipboard.writeText(post().record.value.text);
					closeModal();
				}}
				class={/* @once */ menu.item()}
			>
				<ContentCopyIcon class="text-lg" />
				<span>Copy post text</span>
			</button>

			<button onClick={closeModal} class={/* @once */ menu.cancel()}>
				Cancel
			</button>
		</div>
	);
};

export default PostShareMenu;

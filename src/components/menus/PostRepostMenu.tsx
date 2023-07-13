import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { useNavigate } from '@solidjs/router';

import type { SignalizedPost } from '~/api/cache/posts.ts';
import { repostPost } from '~/api/mutations/repost-post.ts';

import { closeModal } from '~/globals/modals.tsx';

import * as menu from '~/styles/primitives/menu.ts';

import FormatQuoteIcon from '~/icons/baseline-format-quote.tsx';
import RepeatIcon from '~/icons/baseline-repeat.tsx';

export interface PostRepostMenuProps {
	uid: DID;
	post: SignalizedPost;
}

const PostRepostMenu = (props: PostRepostMenuProps) => {
	const navigate = useNavigate();

	const uid = () => props.uid;
	const post = () => props.post;

	const reposted = () => post().viewer.repost.value;

	return (
		<div class={/* @once */ menu.content()}>
			<button
				onClick={() => {
					repostPost(uid(), post());
					closeModal();
				}}
				class={/* @once */ menu.item()}
			>
				<RepeatIcon class="text-lg" />
				<span>{reposted() ? 'Undo repost' : 'Repost'}</span>
			</button>

			<button
				onClick={() => {
					closeModal();
					navigate(`/u/${uid()}/compose?quote=${encodeURIComponent(post().uri)}`);
				}}
				class={/* @once */ menu.item()}
			>
				<FormatQuoteIcon class="text-lg" />
				<span>Quote post</span>
			</button>

			<button onClick={closeModal} class={/* @once */ menu.cancel()}>
				Cancel
			</button>
		</div>
	);
};

export default PostRepostMenu;

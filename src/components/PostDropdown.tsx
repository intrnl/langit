import { createSignal } from 'solid-js';

import { type SignalizedPost } from '~/api/cache/posts.ts';
import { getRecordId } from '~/api/utils.ts';

import Dialog from '~/components/Dialog.tsx';
import * as menu from '~/styles/primitives/menu.ts';

import MoreHorizIcon from '~/icons/baseline-more-horiz.tsx';

export interface PostDropdownProps {
	post: SignalizedPost;
}

const PostDropdown = (props: PostDropdownProps) => {
	const [isOpen, setIsOpen] = createSignal(false);

	const post = () => props.post;
	const author = () => post().author;

	return (
		<>
			<button
				onClick={() => setIsOpen(true)}
				class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base text-muted-fg hover:bg-secondary"
			>
				<MoreHorizIcon />
			</button>

			<Dialog open={isOpen()} onClose={() => setIsOpen(false)}>
				<div class={/* @once */ menu.content()}>
					<button
						onClick={() => {
							open(`https://bsky.app/profile/${author().did}/post/${getRecordId(post().uri)}`, '_blank');
							setIsOpen(false);
						}}
						class={/* @once */ menu.item()}
					>
						Open in Bluesky app
					</button>

					<button
						onClick={() => {
							setIsOpen(false);
						}}
						class={/* @once */ menu.cancel()}
					>
						Cancel
					</button>
				</div>
			</Dialog>
		</>
	);
};

export default PostDropdown;

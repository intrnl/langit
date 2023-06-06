import { type DID } from '~/api/utils.ts';

import { type SignalizedPost } from '~/api/cache/posts.ts';
import { deletePost } from '~/api/mutations/delete-post.ts';

import { closeModal } from '~/globals/modals.tsx';

import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';

export interface DeletePostConfirmDialogProps {
	uid: DID;
	post: SignalizedPost;
}

const DeletePostConfirmDialog = (props: DeletePostConfirmDialogProps) => {
	const uid = () => props.uid;
	const post = () => props.post;

	return (
		<div class={/* @once */ dialog.content()}>
			<h1 class={/* @once */ dialog.title()}>Delete post?</h1>

			<p class="mt-3 text-sm">
				This can't be undone, the post will be deleted from your profile, the timeline of any accounts that
				follow you, and from search results.
			</p>

			<div class={/* @once */ dialog.actions()}>
				<button
					onClick={() => {
						closeModal();
					}}
					class={/* @once */ button({ color: 'ghost' })}
				>
					Cancel
				</button>
				<button
					onClick={() => {
						deletePost(uid(), post());
						closeModal();
					}}
					class={/* @once */ button({ color: 'primary' })}
				>
					Delete
				</button>
			</div>
		</div>
	);
};

export default DeletePostConfirmDialog;

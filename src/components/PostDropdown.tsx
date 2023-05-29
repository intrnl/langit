import { createSignal } from 'solid-js';

import { useNavigate } from '@solidjs/router';

import { type SignalizedPost } from '~/api/cache/posts.ts';
import { type DID, getRecordId } from '~/api/utils.ts';

import { repostPost } from '~/api/mutations/repost-post.ts';

import Dialog from '~/components/Dialog.tsx';
import * as menu from '~/styles/primitives/menu.ts';

import FormatQuoteIcon from '~/icons/baseline-format-quote';
import MoreHorizIcon from '~/icons/baseline-more-horiz.tsx';
import RepeatIcon from '~/icons/baseline-repeat.tsx';

export interface PostDropdownProps {
	post: SignalizedPost;
}

export const PostDropdown = (props: PostDropdownProps) => {
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

export interface PostRepostDropdownProps {
	uid: DID;
	post: SignalizedPost;
	reposted?: boolean;
	large?: boolean;
	class?: string;
}

export const PostRepostDropdown = (props: PostRepostDropdownProps) => {
	const [isOpen, setIsOpen] = createSignal(false);

	const navigate = useNavigate();

	const uid = () => props.uid;
	const post = () => props.post;
	const large = () => props.large;

	const reposted = () => props.reposted;

	return (
		<>
			<button
				class={`flex items-center justify-center rounded-full hover:bg-secondary ${props.class}`}
				classList={{
					'text-green-600': reposted(),
					'h-9 w-9 text-xl': large(),
					'h-8 w-8 text-base': !large(),
				}}
				onClick={() => setIsOpen(true)}
			>
				<RepeatIcon />
			</button>

			<Dialog open={isOpen()} onClose={() => setIsOpen(false)}>
				<div class={/* @once */ menu.content()}>
					<button
						onClick={() => {
							repostPost(uid(), post());
							setIsOpen(false);
						}}
						class={/* @once */ menu.item()}
					>
						<RepeatIcon class="text-lg" />
						<span>{reposted() ? 'Undo repost' : 'Repost'}</span>
					</button>

					<button
						onClick={() => {
							setIsOpen(false);

							setTimeout(() => {
								navigate(`/u/${uid()}/compose?quote=${encodeURIComponent(post().uri)}`);
							}, 0);
						}}
						class={/* @once */ menu.item()}
					>
						<FormatQuoteIcon class="text-lg" />
						<span>Quote post</span>
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

import { type DID } from '~/api/utils.ts';

import { type SignalizedPost } from '~/api/cache/posts.ts';

import { openModal } from '~/globals/modals.tsx';

import PostMenu from '~/components/menus/PostMenu.tsx';
import PostRepostMenu from '~/components/menus/PostRepostMenu.tsx';
import PostShareMenu from '~/components/menus/PostShareMenu.tsx';

import MoreHorizIcon from '~/icons/baseline-more-horiz.tsx';
import RepeatIcon from '~/icons/baseline-repeat.tsx';
import ShareIcon from '~/icons/baseline-share.tsx';

export interface PostDropdownProps {
	uid: DID;
	post: SignalizedPost;
}

export const PostDropdown = (props: PostDropdownProps) => {
	return (
		<button
			onClick={() => {
				openModal(() => <PostMenu uid={props.uid} post={props.post} />);
			}}
			class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base text-muted-fg hover:bg-secondary"
		>
			<MoreHorizIcon />
		</button>
	);
};

export interface PostRepostDropdownProps {
	uid: DID;
	post: SignalizedPost;
	large?: boolean;
	class?: string;
}

export const PostRepostDropdown = (props: PostRepostDropdownProps) => {
	const uid = () => props.uid;
	const post = () => props.post;
	const large = () => props.large;

	const reposted = () => !!post().viewer.repost.value;

	return (
		<button
			class={`flex items-center justify-center rounded-full hover:bg-secondary ${props.class || ''}`}
			classList={{
				'text-green-600': reposted(),
				'h-9 w-9 text-xl': large(),
				'h-8 w-8 text-base': !large(),
			}}
			onClick={() => {
				openModal(() => <PostRepostMenu uid={uid()} post={post()} />);
			}}
		>
			<RepeatIcon />
		</button>
	);
};

export interface PostShareDropdownProps {
	post: SignalizedPost;
	large?: boolean;
	class?: string;
}

export const PostShareDropdown = (props: PostShareDropdownProps) => {
	const large = () => props.large;

	return (
		<button
			class={`flex items-center justify-center rounded-full hover:bg-secondary ${props.class || ''}`}
			classList={{
				'h-9 w-9 text-xl': large(),
				'h-8 w-8 text-base': !large(),
			}}
			onClick={() => {
				openModal(() => <PostShareMenu post={props.post} />);
			}}
		>
			<ShareIcon />
		</button>
	);
};

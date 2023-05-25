import { DropdownMenu } from '@kobalte/core';

import { type SignalizedPost } from '~/api/cache/posts.ts';
import { getRecordId } from '~/api/utils.ts';

import { dropdownItem, dropdownMenu } from '~/styles/primitives/dropdown-menu';

import MoreHorizIcon from '~/icons/baseline-more-horiz.tsx';

export interface PostDropdownProps {
	post: SignalizedPost;
}

const PostDropdown = (props: PostDropdownProps) => {
	const post = () => props.post;
	const author = () => post().author;

	return (
		<DropdownMenu.Root placement="bottom-end">
			<DropdownMenu.Trigger class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base text-muted-fg hover:bg-secondary">
				<MoreHorizIcon />
			</DropdownMenu.Trigger>

			<DropdownMenu.Portal>
				<DropdownMenu.Content class={dropdownMenu()}>
					<DropdownMenu.Item
						as="a"
						onSelect={() =>
							open(`https://bsky.app/profile/${author().did}/post/${getRecordId(post().uri)}`, '_blank')
						}
						class={dropdownItem()}
					>
						Open in Bluesky web app
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	);
};

export default PostDropdown;

import type { SignalizedPost } from '~/api/cache/posts.ts';

import { isLinkValid } from '~/api/richtext/renderer.ts';
import { segmentRichText } from '~/api/richtext/segmentize.ts';
import { getRecordId } from '~/api/utils.ts';

import { closeModal } from '~/globals/modals.tsx';

import * as menu from '~/styles/primitives/menu.ts';

import ContentCopyIcon from '~/icons/baseline-content-copy.tsx';
import LinkIcon from '~/icons/baseline-link.tsx';
import ShareIcon from '~/icons/baseline-share.tsx';

export interface PostShareMenuProps {
	post: SignalizedPost;
}

const hasShare = 'share' in navigator;

const PostShareMenu = (props: PostShareMenuProps) => {
	const post = () => props.post;

	const getUrl = () => {
		const protocol = location.protocol;
		const host = location.host;

		const author = post().author.did;
		const status = getRecordId(post().uri);

		return `${protocol}//${host}/r/profile/${author}/post/${status}`;
	};

	const getPostText = () => {
		const record = post().record.peek();

		const text = record.text;
		const facets = record.facets;

		if (facets) {
			const segments = segmentRichText({ text, facets });

			let result = '';

			for (let idx = 0, len = segments.length; idx < len; idx++) {
				const segment = segments[idx];

				const text = segment.text;
				const link = segment.link;

				if (link && isLinkValid(link.uri, text)) {
					result += link.uri;
				} else {
					result += text;
				}
			}

			return result;
		} else {
			return text;
		}
	};

	return (
		<div class={/* @once */ menu.content()}>
			<button
				onClick={() => {
					navigator.clipboard.writeText(getUrl());
					closeModal();
				}}
				class={/* @once */ menu.item()}
			>
				<LinkIcon class="text-lg" />
				<span>Copy link to post</span>
			</button>

			<button
				onClick={() => {
					navigator.clipboard.writeText(getPostText());
					closeModal();
				}}
				class={/* @once */ menu.item()}
			>
				<ContentCopyIcon class="text-lg" />
				<span>Copy post text</span>
			</button>

			{hasShare && (
				<button
					onClick={() => {
						navigator.share({ url: getUrl() });
						closeModal();
					}}
					class={/* @once */ menu.item()}
				>
					<ShareIcon class="text-lg" />
					<span>Share post via...</span>
				</button>
			)}

			<button onClick={closeModal} class={/* @once */ menu.cancel()}>
				Cancel
			</button>
		</div>
	);
};

export default PostShareMenu;

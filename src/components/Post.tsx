import { Show } from 'solid-js';

import { A as UntypedAnchor } from '@solidjs/router';

import { type SignalizedPost, type SignalizedTimelinePost } from '~/api/cache.ts';
import { favoritePost, repostPost } from '~/api/mutation.ts';
import { getPostId } from '~/api/utils.ts';

import { A, useNavigate } from '~/router.ts';
import * as comformat from '~/utils/intl/comformatter.ts';
import * as relformat from '~/utils/intl/relformatter.ts';

import Embed from '~/components/Embed.tsx';

import FavoriteIcon from '~/icons/baseline-favorite.tsx';
import MoreHorizIcon from '~/icons/baseline-more-horiz.tsx';
import RepeatIcon from '~/icons/baseline-repeat.tsx';
import ShareIcon from '~/icons/baseline-share.tsx';
import ChatBubbleOutlinedIcon from '~/icons/outline-chat-bubble.tsx';
import FavoriteOutlinedIcon from '~/icons/outline-favorite.tsx';

interface PostProps {
	uid: string;
	post: SignalizedPost;
	parent?: SignalizedPost;
	reason?: SignalizedTimelinePost['reason'];
	prev?: boolean;
	next?: boolean;
	interactive?: boolean;
}

const Post = (props: PostProps) => {
	const navigate = useNavigate();

	const uid = () => props.uid;
	const post = () => props.post;
	const parent = () => props.parent;
	const interactive = () => props.interactive;

	const author = () => post().author;
	const record = () => post().record.value;

	const handleClick = (ev: MouseEvent | KeyboardEvent) => {
		if (!props.interactive) {
			return;
		}

		const path = ev.composedPath() as HTMLElement[];

		for (let idx = 0, len = path.length; idx < len; idx++) {
			const node = path[idx];
			const tag = node.localName;

			if (node == ev.currentTarget) {
				break;
			}

			if (tag === 'a' || tag === 'button' || tag === 'img' || tag === 'video') {
				return;
			}
		}

		if (window.getSelection()?.toString()) {
			return;
		}

		navigate('/u/:uid/profile/:actor/post/:status', {
			params: {
				uid: uid(),
				actor: author().did,
				status: getPostId(post().uri),
			},
		});
	};

	return (
		<div
			tabindex={interactive() ? 0 : undefined}
			onClick={handleClick}
			class='relative px-4 border-divider'
			classList={{ 'border-b': !props.next, 'hover:bg-hinted': interactive() }}
		>
			<div class='pt-3 flex flex-col gap-1'>
				<Show when={props.reason && props.reason.$type === 'app.bsky.feed.defs#reasonRepost'}>
					<div class='-mt-1 mb-1 flex items-center gap-3 text-[0.8125rem] text-muted-fg'>
						<div class='flex justify-end w-12 shrink-0'>
							<RepeatIcon />
						</div>
						<div>
							<A
								href='/u/:uid/profile/:actor'
								params={{ uid: uid(), actor: props.reason!.by.did }}
								class='grow line-clamp-1 min-w-0 font-medium hover:underline'
							>
								{props.reason!.by.displayName} Retweeted
							</A>
						</div>
					</div>
				</Show>

				<Show when={parent() && !props.prev}>
					<div class='-mt-1 mb-1 flex items-center gap-3 text-[0.8125rem] text-muted-fg'>
						<div class='flex justify-end w-12 shrink-0'>
							<ChatBubbleOutlinedIcon />
						</div>
						<div>
							<A
								href='/u/:uid/profile/:actor/post/:status'
								params={{ uid: uid(), actor: parent()!.author.did, status: getPostId(parent()!.uri) }}
								class='grow line-clamp-1 min-w-0 font-medium hover:underline'
							>
								Replying to {parent()!.author.displayName.value}
							</A>
						</div>
					</div>
				</Show>
			</div>

			<div class='flex gap-3'>
				<div class='flex flex-col items-center shrink-0'>
					<A
						href='/u/:uid/profile/:actor'
						params={{ uid: uid(), actor: author().did }}
						class='h-12 w-12 rounded-full bg-muted-fg overflow-hidden hover:opacity-80'
					>
						<Show when={author().avatar.value}>
							{(avatar) => <img src={avatar()} class='h-full w-full' />}
						</Show>
					</A>

					<Show when={props.next}>
						<div class='mt-3 grow border-l-2 border-divider' />
					</Show>
				</div>

				<div class='grow min-w-0 pb-3'>
					<div class='flex gap-4 items-center justify-between mb-0.5'>
						<div class='flex items-center text-sm'>
							<div>
								<A
									href='/u/:uid/profile/:actor'
									params={{ uid: uid(), actor: author().did }}
									class='group flex gap-1'
								>
									<span class='font-bold break-all whitespace-pre-wrap break-words line-clamp-1 group-hover:underline empty:hidden'>
										{author().displayName.value}
									</span>
									<span class='text-muted-fg break-all whitespace-pre-wrap line-clamp-1'>
										@{author().handle.value}
									</span>
								</A>
							</div>

							<span class='text-muted-fg'>
								<span class='px-1'>·</span>
								<A
									href='/u/:uid/profile/:actor/post/:status'
									params={{
										uid: uid(),
										actor: author().did,
										status: getPostId(post().uri),
									}}
									class='hover:underline whitespace-nowrap'
								>
									{relformat.format(record().createdAt)}
								</A>
							</span>
						</div>

						<Show when={interactive()}>
							<div class='shrink-0'>
								<button class='flex items-center justify-center h-8 w-8 -my-1.5 -mx-2 rounded-full text-base text-muted-fg hover:bg-secondary'>
									<MoreHorizIcon />
								</button>
							</div>
						</Show>
					</div>

					<Show when={record().text}>
						<div class='text-sm whitespace-pre-wrap break-words'>
							{post().$renderedContent(uid())}
						</div>
					</Show>

					<Show when={post().embed.value}>
						{(embed) => <Embed uid={uid()} embed={embed()} />}
					</Show>

					<Show when={interactive()}>
						<div class='flex mt-3 text-muted-fg'>
							<div class='flex items-end grow gap-0.5'>
								<UntypedAnchor
									href={`/u/${uid()}/compose?reply=${encodeURIComponent(post().uri)}`}
									class='flex items-center justify-center h-8 w-8 -my-1.5 -ml-2 rounded-full text-base hover:bg-secondary'
								>
									<ChatBubbleOutlinedIcon />
								</UntypedAnchor>
								<span class='text-[0.8125rem]'>{comformat.format(post().replyCount.value)}</span>
							</div>

							<div
								class='flex items-end grow gap-0.5'
								classList={{ 'text-green-600': !!post().viewer.repost.value }}
							>
								<button
									class='flex items-center justify-center h-8 w-8 -my-1.5 -ml-2 rounded-full text-base hover:bg-secondary'
									onClick={() => repostPost(uid(), post())}
								>
									<RepeatIcon />
								</button>
								<span class='text-[0.8125rem]'>{comformat.format(post().repostCount.value)}</span>
							</div>

							<div
								class='group flex items-end grow gap-0.5'
								classList={{ 'is-active text-red-600': !!post().viewer.like.value }}
							>
								<button
									class='flex items-center justify-center h-8 w-8 -my-1.5 -ml-2 rounded-full text-base hover:bg-secondary'
									onClick={() => favoritePost(uid(), post())}
								>
									<FavoriteOutlinedIcon class='group-[.is-active]:hidden' />
									<FavoriteIcon class='hidden group-[.is-active]:block' />
								</button>
								<span class='text-[0.8125rem]'>{comformat.format(post().likeCount.value)}</span>
							</div>

							<div class='shrink-0'>
								<button class='flex items-center justify-center h-8 w-8 -my-1.5 -mx-2 rounded-full text-base hover:bg-secondary'>
									<ShareIcon />
								</button>
							</div>
						</div>
					</Show>
				</div>
			</div>
		</div>
	);
};

export default Post;

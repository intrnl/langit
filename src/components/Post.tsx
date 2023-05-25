import { Show } from 'solid-js';

import { A as UntypedAnchor, useNavigate } from '@solidjs/router';

import { type SignalizedPost, type SignalizedTimelinePost } from '~/api/cache/posts.ts';
import { type DID, getRecordId } from '~/api/utils.ts';

import { favoritePost } from '~/api/mutations/favorite-post.ts';
import { repostPost } from '~/api/mutations/repost-post.ts';

import { A } from '~/router.ts';
import * as comformat from '~/utils/intl/comformatter.ts';
import * as relformat from '~/utils/intl/relformatter.ts';
import { isElementAltClicked, isElementClicked } from '~/utils/misc.ts';

import Embed from '~/components/Embed.tsx';
import PostDropdown from '~/components/PostDropdown.tsx';

import FavoriteIcon from '~/icons/baseline-favorite.tsx';
import RepeatIcon from '~/icons/baseline-repeat.tsx';
import ShareIcon from '~/icons/baseline-share.tsx';
import ChatBubbleOutlinedIcon from '~/icons/outline-chat-bubble.tsx';
import FavoriteOutlinedIcon from '~/icons/outline-favorite.tsx';

interface PostProps {
	uid: DID;
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
	const reason = () => props.reason;

	const author = () => post().author;
	const record = () => post().record.value;

	const handleClick = (ev: MouseEvent | KeyboardEvent) => {
		if (!props.interactive || !isElementClicked(ev)) {
			return;
		}

		const path = `/u/${uid()}/profile/${author().did}/post/${getRecordId(post().uri)}`;

		if (isElementAltClicked(ev)) {
			open(path, '_blank');
		} else {
			navigate(path);
		}
	};

	return (
		<div
			tabindex={interactive() ? 0 : undefined}
			onClick={handleClick}
			onAuxClick={handleClick}
			onKeyDown={handleClick}
			class="relative border-divider px-4"
			classList={{ 'border-b': !props.next, 'hover:bg-hinted': interactive() }}
		>
			<div class="flex flex-col gap-1 pt-3">
				<Show when={reason() && reason()!.$type === 'app.bsky.feed.defs#reasonRepost'}>
					<div class="-mt-1 mb-1 flex items-center gap-3 text-[0.8125rem] text-muted-fg">
						<div class="flex w-12 shrink-0 justify-end">
							<RepeatIcon />
						</div>
						<div>
							<A
								href="/u/:uid/profile/:actor"
								params={{ uid: uid(), actor: reason()!.by.did }}
								class="line-clamp-1 min-w-0 grow font-medium hover:underline"
							>
								{reason()!.by.displayName || reason()!.by.handle} Reposted
							</A>
						</div>
					</div>
				</Show>

				<Show when={parent() && !props.prev}>
					<div class="-mt-1 mb-1 flex items-center gap-3 text-[0.8125rem] text-muted-fg">
						<div class="flex w-12 shrink-0 justify-end">
							<ChatBubbleOutlinedIcon />
						</div>
						<div>
							<A
								href="/u/:uid/profile/:actor/post/:status"
								params={{ uid: uid(), actor: parent()!.author.did, status: getRecordId(parent()!.uri) }}
								class="line-clamp-1 min-w-0 grow font-medium hover:underline"
							>
								Replying to {parent()!.author.displayName.value}
							</A>
						</div>
					</div>
				</Show>
			</div>

			<div class="flex gap-3">
				<div class="flex shrink-0 flex-col items-center">
					<A
						href="/u/:uid/profile/:actor"
						params={{ uid: uid(), actor: author().did }}
						class="h-12 w-12 overflow-hidden rounded-full bg-muted-fg hover:opacity-80"
					>
						<Show when={author().avatar.value}>
							{(avatar) => <img src={avatar()} class="h-full w-full" />}
						</Show>
					</A>

					<Show when={props.next}>
						<div class="mt-3 grow border-l-2 border-divider" />
					</Show>
				</div>

				<div class="min-w-0 grow pb-3">
					<div class="mb-0.5 flex items-center justify-between gap-4">
						<div class="flex items-center text-sm">
							<div>
								<A
									href="/u/:uid/profile/:actor"
									params={{ uid: uid(), actor: author().did }}
									class="group flex gap-1"
								>
									<span class="line-clamp-1 whitespace-pre-wrap break-words break-all font-bold group-hover:underline">
										{author().displayName.value || author().handle.value}
									</span>
									<span class="line-clamp-1 whitespace-pre-wrap break-all text-muted-fg">
										@{author().handle.value}
									</span>
								</A>
							</div>

							<span class="text-muted-fg">
								<span class="px-1">·</span>
								<A
									href="/u/:uid/profile/:actor/post/:status"
									params={{
										uid: uid(),
										actor: author().did,
										status: getRecordId(post().uri),
									}}
									class="whitespace-nowrap hover:underline"
								>
									{relformat.format(record().createdAt)}
								</A>
							</span>
						</div>

						<Show when={interactive()}>
							<div class="shrink-0">
								<PostDropdown post={post()} />
							</div>
						</Show>
					</div>

					<Show when={record().text}>
						<div class="whitespace-pre-wrap break-words text-sm">{post().$renderedContent(uid())}</div>
					</Show>

					<Show when={post().embed.value}>{(embed) => <Embed uid={uid()} embed={embed()} />}</Show>

					<Show when={interactive()}>
						<div class="mt-3 flex text-muted-fg">
							<div class="flex grow items-end gap-0.5">
								<UntypedAnchor
									href={`/u/${uid()}/compose?reply=${encodeURIComponent(post().uri)}`}
									class="-my-1.5 -ml-2 flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-secondary"
								>
									<ChatBubbleOutlinedIcon />
								</UntypedAnchor>
								<span class="text-[0.8125rem]">{comformat.format(post().replyCount.value)}</span>
							</div>

							<div
								class="flex grow items-end gap-0.5"
								classList={{ 'text-green-600': !!post().viewer.repost.value }}
							>
								<button
									class="-my-1.5 -ml-2 flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-secondary"
									onClick={() => repostPost(uid(), post())}
								>
									<RepeatIcon />
								</button>
								<span class="text-[0.8125rem]">{comformat.format(post().repostCount.value)}</span>
							</div>

							<div
								class="group flex grow items-end gap-0.5"
								classList={{ 'is-active text-red-600': !!post().viewer.like.value }}
							>
								<button
									class="-my-1.5 -ml-2 flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-secondary"
									onClick={() => favoritePost(uid(), post())}
								>
									<FavoriteOutlinedIcon class="group-[.is-active]:hidden" />
									<FavoriteIcon class="hidden group-[.is-active]:block" />
								</button>
								<span class="text-[0.8125rem]">{comformat.format(post().likeCount.value)}</span>
							</div>

							<div class="shrink-0">
								<button class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-secondary">
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

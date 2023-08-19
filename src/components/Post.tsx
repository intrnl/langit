import { type Accessor, Match, Show, Switch, createSignal } from 'solid-js';

import type { DID, RefOf } from '@intrnl/bluesky-client/atp-schema';
import { A as UntypedAnchor, useNavigate } from '@solidjs/router';

import type { SignalizedPost, SignalizedTimelinePost } from '~/api/cache/posts.ts';
import { favoritePost } from '~/api/mutations/favorite-post.ts';

import { type ModerationDecision, CauseLabel, CauseMutedKeyword } from '~/api/moderation/action.ts';
import { getRecordId } from '~/api/utils.ts';

import { openModal } from '~/globals/modals.tsx';
import { A } from '~/router.ts';
import * as comformat from '~/utils/intl/comformatter.ts';
import * as relformat from '~/utils/intl/relformatter.ts';
import { isElementAltClicked, isElementClicked } from '~/utils/misc.ts';

import Embed from '~/components/Embed.tsx';
import PostMenu from '~/components/menus/PostMenu.tsx';
import PostRepostMenu from '~/components/menus/PostRepostMenu.tsx';
import PostShareMenu from '~/components/menus/PostShareMenu.tsx';

import FavoriteIcon from '~/icons/baseline-favorite.tsx';
import MoreHorizIcon from '~/icons/baseline-more-horiz';
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
	highlight?: boolean;
	timelineDid?: DID;
}

const Post = (props: PostProps) => {
	const navigate = useNavigate();

	const uid = () => props.uid;
	const post = () => props.post;
	const parent = () => props.parent;
	const interactive = () => props.interactive;
	const reason = () => props.reason;
	const prev = () => props.prev;

	const author = () => post().author;
	const record = () => post().record.value;

	const handleClick = (ev: MouseEvent | KeyboardEvent, translate?: boolean) => {
		if (!props.interactive || !isElementClicked(ev)) {
			return;
		}

		let path = `/u/${uid()}/profile/${author().did}/post/${getRecordId(post().uri)}`;

		if (translate) {
			path += '?tl=y';
		}

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
			classList={{
				'border-b': !props.next,
				'hover:bg-hinted': interactive(),
				'bg-accent/20': props.highlight,
			}}
		>
			<div class="flex flex-col gap-1 pt-3">
				<Show when={reason() && reason()!.$type === 'app.bsky.feed.defs#reasonRepost'}>
					<div class="-mt-1 mb-1 flex items-center gap-3 text-[0.8125rem] text-muted-fg">
						<div class="flex w-10 shrink-0 justify-end">
							<RepeatIcon />
						</div>
						<div class="min-w-0">
							<A
								href="/u/:uid/profile/:actor"
								params={{ uid: uid(), actor: reason()!.by.did }}
								class="flex font-medium hover:underline"
							>
								<span dir="auto" class="line-clamp-1 break-all">
									{reason()!.by.displayName || reason()!.by.handle}
								</span>
								<span class="whitespace-pre"> Reposted</span>
							</A>
						</div>
					</div>
				</Show>

				<Switch>
					<Match when={!prev() && parent()}>
						<div class="-mt-1 mb-1 flex items-center gap-3 text-[0.8125rem] text-muted-fg">
							<div class="flex w-10 shrink-0 justify-end">
								<ChatBubbleOutlinedIcon />
							</div>
							<div class="min-w-0">
								<A
									href="/u/:uid/profile/:actor/post/:status"
									params={{ uid: uid(), actor: parent()!.author.did, status: getRecordId(parent()!.uri) }}
									class="flex font-medium hover:underline"
								>
									<span class="whitespace-pre">Replying to </span>
									<span dir="auto" class="line-clamp-1">
										{parent()!.author.displayName.value || parent()!.author.handle.value}
									</span>
								</A>
							</div>
						</div>
					</Match>

					<Match when={!prev() && post().record.value.reply}>
						<div class="-mt-1 mb-1 flex items-center gap-3 text-[0.8125rem] text-muted-fg">
							<div class="flex w-10 shrink-0 justify-end">
								<ChatBubbleOutlinedIcon />
							</div>
							<div class="min-w-0">
								<A
									href="/u/:uid/profile/:actor/post/:status"
									params={{ uid: uid(), actor: post().author.did, status: getRecordId(post()!.uri) }}
									class="flex font-medium hover:underline"
								>
									Show full thread
								</A>
							</div>
						</div>
					</Match>
				</Switch>
			</div>

			<div class="flex gap-3">
				<div class="flex shrink-0 flex-col items-center">
					<A
						href="/u/:uid/profile/:actor"
						params={{ uid: uid(), actor: author().did }}
						class="h-10 w-10 overflow-hidden rounded-full bg-muted-fg hover:opacity-80"
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
									<span dir="auto" class="line-clamp-1 break-all font-bold group-hover:underline">
										{author().displayName.value || author().handle.value}
									</span>
									<span class="line-clamp-1 break-all text-muted-fg">@{author().handle.value}</span>
								</A>
							</div>

							<span class="text-muted-fg">
								<span class="px-1">·</span>
								<A
									title={relformat.formatAbsWithTime(record().createdAt)}
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
								<button
									onClick={() => {
										openModal(() => (
											<PostMenu uid={uid()} post={post()} onTranslate={(ev) => handleClick(ev, true)} />
										));
									}}
									class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base text-muted-fg hover:bg-secondary"
								>
									<MoreHorizIcon />
								</button>
							</div>
						</Show>
					</div>

					<PostContent uid={uid} post={post} timelineDid={props.timelineDid} />

					<Show when={interactive()}>
						<div class="mt-3 flex text-muted-fg">
							<div class="flex grow basis-0 items-end gap-0.5">
								<UntypedAnchor
									href={`/u/${uid()}/compose?reply=${encodeURIComponent(post().uri)}`}
									class="-my-1.5 -ml-2 flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-secondary"
								>
									<ChatBubbleOutlinedIcon />
								</UntypedAnchor>
								<span class="text-[0.8125rem]">{comformat.format(post().replyCount.value)}</span>
							</div>

							<div
								class="flex grow basis-0 items-end gap-0.5"
								classList={{ 'text-green-600': !!post().viewer.repost.value }}
							>
								<button
									class="-my-1.5 -ml-2 flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-secondary"
									classList={{
										'text-green-600': !!post().viewer.repost.value,
									}}
									onClick={() => {
										openModal(() => <PostRepostMenu uid={uid()} post={post()} />);
									}}
								>
									<RepeatIcon />
								</button>

								<span class="text-[0.8125rem]">{comformat.format(post().repostCount.value)}</span>
							</div>

							<div
								class="group flex grow basis-0 items-end gap-0.5"
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
								<button
									class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-secondary"
									onClick={() => {
										openModal(() => <PostShareMenu post={post()} />);
									}}
								>
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

// <PostContent />
interface PostContentProps {
	uid: Accessor<DID>;
	post: Accessor<SignalizedPost>;
	timelineDid?: DID;
	force?: boolean;
}

const PostContent = ({ uid, post, force, timelineDid }: PostContentProps) => {
	const mod = post().$mod();

	if (
		!force &&
		mod?.b &&
		(!timelineDid ||
			mod.s.t === CauseLabel ||
			mod.s.t === CauseMutedKeyword ||
			timelineDid !== post().author.did)
	) {
		const [show, setShow] = createSignal(false);

		const source = mod.s;
		const title =
			source.t === CauseLabel
				? `Content warning: ${source.l.val}`
				: source.t === CauseMutedKeyword
				? `Filtered: ${source.n}`
				: `You've muted this user`;

		return (
			<>
				<div
					class="mt-3 flex items-stretch justify-between gap-3 overflow-hidden rounded-md border border-divider"
					classList={{ 'mb-3': show() }}
				>
					<p class="m-3 text-sm text-muted-fg">{title}</p>

					<button
						onClick={() => setShow(!show())}
						class="px-4 text-sm font-medium hover:bg-secondary hover:text-hinted-fg"
					>
						{show() ? 'Hide' : 'Show'}
					</button>
				</div>

				<Show when={show()}>
					<PostContent uid={uid} post={post} force />
				</Show>
			</>
		);
	}

	return (
		<>
			<Show when={post().$deleted.value}>
				<div class="text-sm text-muted-fg">This post has been deleted.</div>
			</Show>

			<div class="whitespace-pre-wrap break-words text-sm">{post().$renderedContent()}</div>

			<Show when={post().embed.value}>
				{(embed) => <PostEmbedContent uid={uid} mod={mod} embed={embed} />}
			</Show>
		</>
	);
};

// <PostEmbedContent />
interface PostEmbedContentProps {
	uid: Accessor<DID>;
	mod?: ModerationDecision;
	embed: Accessor<NonNullable<RefOf<'app.bsky.feed.defs#postView'>['embed']>>;
	force?: boolean;
}

const PostEmbedContent = ({ uid, mod, embed, force }: PostEmbedContentProps) => {
	if (!force && mod?.m) {
		const [show, setShow] = createSignal(false);

		const source = mod.s;
		const title = `Media warning${source.t === CauseLabel ? `: ${source.l.val}` : ''}`;

		return (
			<>
				<div class="mt-3 flex items-stretch justify-between gap-3 overflow-hidden rounded-md border border-divider">
					<p class="m-3 text-sm text-muted-fg">{title}</p>

					<button
						onClick={() => setShow(!show())}
						class="px-4 text-sm font-medium hover:bg-secondary hover:text-hinted-fg"
					>
						{show() ? 'Hide' : 'Show'}
					</button>
				</div>

				<Show when={show()}>
					<PostEmbedContent uid={uid} embed={embed} force />
				</Show>
			</>
		);
	}

	return <Embed uid={uid()} embed={embed()} />;
};

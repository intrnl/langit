import { Show } from 'solid-js';

import { type BskyPost, type BskyTimelinePost } from '~/api/types';

import { A } from '~/router.ts';
import * as relformat from '~/utils/relformatter.ts';

import FavoriteIcon from '~/icons/baseline-favorite.tsx';
import MoreHorizIcon from '~/icons/baseline-more-horiz.tsx';
import RepeatIcon from '~/icons/baseline-repeat.tsx';
import ShareIcon from '~/icons/baseline-share.tsx';
import ChatBubbleOutlinedIcon from '~/icons/outline-chat-bubble.tsx';
import FavoriteOutlinedIcon from '~/icons/outline-favorite.tsx';

const getPostId = (uri: string) => {
	const idx = uri.lastIndexOf('/');
	return uri.slice(idx + 1);
};

interface PostProps {
	uid: string;
	post: BskyPost;
	parent?: BskyPost;
	reason?: BskyTimelinePost['reason'];
	prev?: boolean;
	next?: boolean;
}

const Post = (props: PostProps) => {
	const post = () => props.post;
	const author = () => post().author;
	const record = () => post().record;

	return (
		<div class='relative px-4 hover:bg-hinted border-divider' classList={{ 'border-b': !props.next }}>
			<div class='pt-3'>
				<Show when={props.reason && props.reason.$type === 'app.bsky.feed.defs#reasonRepost'}>
					<div class='-mt-1 mb-1 flex items-center gap-3 text-[0.8125rem] text-muted-fg'>
						<div class='flex justify-end w-12 shrink-0'>
							<RepeatIcon />
						</div>
						<span class='grow min-w-0 font-medium'>{props.reason!.by.displayName} Retweeted</span>
					</div>
				</Show>

				<Show when={props.parent && !props.prev}>
					<div class='-mt-1 mb-1 flex items-center gap-3 text-[0.8125rem] text-muted-fg'>
						<div class='flex justify-end w-12 shrink-0'>
							<ChatBubbleOutlinedIcon />
						</div>
						<span class='grow min-w-0 font-medium'>Replying to {props.parent!.author.displayName}</span>
					</div>
				</Show>
			</div>

			<div class='flex gap-3'>
				<div class='flex flex-col items-center shrink-0'>
					<A
						href='/u/:uid/profile/:handle'
						params={{ uid: props.uid, handle: author().handle }}
						class='h-12 w-12 rounded-full bg-muted-fg overflow-hidden hover:opacity-80'
					>
						<Show when={author().avatar} keyed>
							{(avatar) => <img src={avatar} class='h-full w-full' />}
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
									href='/u/:uid/profile/:handle'
									params={{ uid: props.uid, handle: author().handle }}
									class='group flex gap-1'
								>
									<span class='font-bold break-all whitespace-pre-wrap break-words line-clamp-1 group-hover:underline'>
										{author().displayName}
									</span>
									<span class='text-muted-fg break-all whitespace-pre-wrap line-clamp-1'>
										@{author().handle}
									</span>
								</A>
							</div>

							<span class='text-muted-fg'>
								<span class='px-1'>·</span>
								<A
									href='/u/:uid/profile/:handle/post/:status'
									params={{
										uid: props.uid,
										handle: author().handle,
										status: getPostId(post().uri),
									}}
									class='hover:underline'
								>
									{relformat.format(record().createdAt)}
								</A>
							</span>
						</div>
						<div class='shrink-0'>
							<button class='flex items-center justify-center h-8 w-8 -my-1.5 -mr-2 rounded-full text-base text-muted-fg hover:bg-secondary'>
								<MoreHorizIcon />
							</button>
						</div>
					</div>

					<div class='text-sm whitespace-pre-wrap break-words empty:hidden'>
						{record().text}
					</div>

					<Show when={post().embed} keyed>
						{(embed) => {
							const images = embed.images;
							const record = embed.record?.record || embed.record;

							return (
								<div class='flex flex-col gap-3 mt-3'>
									{images && (
										<div class='rounded-md border border-divider overflow-hidden'>
											<img src={images[0].thumb} class='w-full' />
										</div>
									)}

									{record && (
										<div class='rounded-md border border-divider overflow-hidden hover:bg-secondary'>
											<div class='mx-3 mt-3 flex text-sm text-muted-fg'>
												<div class='h-5 w-5 mr-1 rounded-full overflow-hidden bg-muted-fg shrink-0'>
													<Show when={record.author?.avatar} keyed>
														{(avatar) => <img src={avatar} class='h-full w-full' />}
													</Show>
												</div>

												<span class='text-primary font-bold break-all whitespace-pre-wrap break-words line-clamp-1 group-hover:underline'>
													{record.author?.displayName}
												</span>
												<span class='ml-1 break-all whitespace-pre-wrap line-clamp-1'>
													@{record.author?.handle}
												</span>
												<span class='px-1'>·</span>
												<span>{relformat.format(record.value.createdAt)}</span>
											</div>

											<div class='mx-3 mt-1 mb-3 text-sm whitespace-pre-wrap break-words empty:hidden'>
												{record.value.text}
											</div>
										</div>
									)}
								</div>
							);
						}}
					</Show>

					<div class='flex mt-3 text-muted-fg'>
						<div class='flex items-end grow gap-0.5'>
							<button class='flex items-center justify-center h-8 w-8 -my-1.5 -ml-2 rounded-full text-base hover:bg-secondary'>
								<ChatBubbleOutlinedIcon />
							</button>
							<span class='text-[0.8125rem]'>{post().replyCount}</span>
						</div>

						<div
							class='flex items-end grow gap-0.5'
							classList={{ 'text-green-600': !!post().viewer.repost }}
						>
							<button class='flex items-center justify-center h-8 w-8 -my-1.5 -ml-2 rounded-full text-base hover:bg-secondary'>
								<RepeatIcon />
							</button>
							<span class='text-[0.8125rem]'>{post().repostCount}</span>
						</div>

						<div
							class='group flex items-end grow gap-0.5'
							classList={{ 'is-active text-red-600': !!post().viewer.like }}
						>
							<button class='flex items-center justify-center h-8 w-8 -my-1.5 -ml-2 rounded-full text-base hover:bg-secondary'>
								<FavoriteOutlinedIcon class='group-[.is-active]:hidden' />
								<FavoriteIcon class='hidden group-[.is-active]:block' />
							</button>
							<span class='text-[0.8125rem]'>{post().likeCount}</span>
						</div>

						<div class='shrink-0'>
							<button class='flex items-center justify-center h-8 w-8 -my-1.5 -mx-2 rounded-full text-base hover:bg-secondary'>
								<ShareIcon />
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Post;

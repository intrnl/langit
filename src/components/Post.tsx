import { Show } from 'solid-js';

import { type BskyPost, type BskyTimelinePost } from '~/api/types';

import { A } from '~/router';
import * as relformat from '~/utils/relformatter';

import MoreHorizIcon from '~/icons/baseline-more-horiz';
import RepeatIcon from '~/icons/baseline-repeat';
import ShareIcon from '~/icons/baseline-share';
import ChatBubbleOutlinedIcon from '~/icons/outline-chat-bubble';
import FavoriteOutlinedIcon from '~/icons/outline-favorite';

const getPostId = (uri: string) => {
	const idx = uri.lastIndexOf('/');
	return uri.slice(idx + 1);
};

const Post = (props: { uid: string; post: BskyPost; next?: boolean; reason?: BskyTimelinePost['reason'] }) => {
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
			</div>

			<div class='flex gap-3'>
				<div class='flex flex-col items-center shrink-0'>
					<div class='h-12 w-12 rounded-full bg-muted-fg overflow-hidden'>
						<Show when={props.post.author.avatar} keyed>
							{(avatar) => <img src={avatar} class='h-full w-full' />}
						</Show>
					</div>

					<Show when={props.next}>
						<div class='mt-3 grow border-l-2 border-divider' />
					</Show>
				</div>

				<div class='grow min-w-0 pb-3'>
					<div class='flex gap-4 items-center justify-between mb-0.5'>
						<div class='flex items-center text-sm'>
							<div>
								<a class='group flex gap-1'>
									<span class='font-bold break-all whitespace-pre-wrap break-words line-clamp-1 group-hover:underline'>
										{props.post.author.displayName}
									</span>
									<span class='text-muted-fg break-all whitespace-pre-wrap line-clamp-1'>
										@{props.post.author.handle}
									</span>
								</a>
							</div>

							<span class='text-muted-fg'>
								<span class='px-1'>·</span>
								<A
									href='/u/:uid/profile/:handle/status/:status'
									params={{
										uid: props.uid,
										handle: props.post.author.handle,
										status: getPostId(props.post.uri),
									}}
									class='hover:underline'
								>
									{relformat.format(props.post.record.createdAt)}
								</A>
							</span>
						</div>
						<div class='shrink-0'>
							<button class='flex items-center justify-center h-8 w-8 -my-1.5 -mr-2 rounded-full text-base text-muted-fg hover:bg-secondary'>
								<MoreHorizIcon />
							</button>
						</div>
					</div>

					<div class='text-sm whitespace-pre-wrap break-words'>
						<p>
							{props.post.record.text}
						</p>
					</div>

					<div class='flex mt-3 text-muted-fg'>
						<div class='flex items-center flex-grow gap-0.5'>
							<button class='flex items-center justify-center h-8 w-8 -my-1.5 -ml-2 rounded-full text-base hover:bg-secondary'>
								<ChatBubbleOutlinedIcon />
							</button>
							<span class='text-[0.8125rem]'>{props.post.replyCount}</span>
						</div>
						<div class='flex items-center flex-grow gap-0.5'>
							<button class='flex items-center justify-center h-8 w-8 -my-1.5 -ml-2 rounded-full text-base hover:bg-secondary'>
								<RepeatIcon />
							</button>
							<span class='text-[0.8125rem]'>{props.post.repostCount}</span>
						</div>
						<div class='flex items-center flex-grow gap-0.5'>
							<button class='flex items-center justify-center h-8 w-8 -my-1.5 -ml-2 rounded-full text-base hover:bg-secondary'>
								<FavoriteOutlinedIcon />
							</button>
							<span class='text-[0.8125rem]'>{props.post.likeCount}</span>
						</div>
						<div class='flex-shrink'>
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

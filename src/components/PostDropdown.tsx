import { For, Show, createSignal } from 'solid-js';

import { useNavigate } from '@solidjs/router';

import { multiagent } from '~/api/global.ts';
import { type DID, getRecordId, getRepoId } from '~/api/utils.ts';

import { type SignalizedPost } from '~/api/cache/posts.ts';
import { repostPost } from '~/api/mutations/repost-post.ts';

import { A } from '~/router.ts';

import Dialog from '~/components/Dialog.tsx';
import * as menu from '~/styles/primitives/menu.ts';

import FormatQuoteIcon from '~/icons/baseline-format-quote';
import MoreHorizIcon from '~/icons/baseline-more-horiz.tsx';
import RepeatIcon from '~/icons/baseline-repeat.tsx';

export interface PostDropdownProps {
	uid: DID;
	post: SignalizedPost;
}

export const PostDropdown = (props: PostDropdownProps) => {
	const [isOpen, setIsOpen] = createSignal(false);
	const [isSwitching, setIsSwitching] = createSignal(false);

	const uid = () => props.uid;
	const post = () => props.post;

	const author = () => post().author;

	const hasMultiaccounts = () => Object.keys(multiagent.accounts).length > 1;

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

					<Show when={hasMultiaccounts()}>
						<button
							onClick={() => {
								setIsOpen(false);
								setIsSwitching(true);
							}}
							class={/* @once */ menu.item()}
						>
							Open in another account...
						</button>
					</Show>

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

			<Show when={hasMultiaccounts()}>
				<Dialog open={isSwitching()} onClose={() => setIsSwitching(false)}>
					<div class={/* @once */ menu.content()}>
						<h1 class={/* @once */ menu.title()}>Choose account</h1>

						<For each={Object.values(multiagent.accounts).filter((account) => account.did !== uid())}>
							{(account) => {
								const profile = account.profile;
								const did = account.did;

								return (
									<A
										href="/u/:uid/profile/:actor/post/:status"
										params={{
											uid: did,
											actor: getRepoId(post().uri),
											status: getRecordId(post().uri),
										}}
										class="flex items-center gap-4 px-4 py-3 hover:bg-hinted"
									>
										<div class="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted-fg">
											<Show when={profile?.avatar}>
												{(avatar) => <img src={avatar()} class="h-full w-full" />}
											</Show>
										</div>

										<Show when={profile} fallback={<div class="grow text-sm">{did}</div>}>
											{(profile) => (
												<div class="flex grow flex-col text-sm">
													<p class="line-clamp-1 break-all font-bold">
														{profile().displayName || profile().handle}
													</p>
													<p class="line-clamp-1 break-all text-muted-fg">@{profile().handle}</p>
												</div>
											)}
										</Show>
									</A>
								);
							}}
						</For>

						<button
							onClick={() => {
								setIsSwitching(false);
							}}
							class={/* @once */ menu.cancel()}
						>
							Cancel
						</button>
					</div>
				</Dialog>
			</Show>
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

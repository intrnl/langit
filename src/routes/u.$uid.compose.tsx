import { type Accessor, For, Match, Show, Switch, createMemo, createSignal } from 'solid-js';
import { render } from 'solid-js/web';

import { useBeforeLeave, useSearchParams } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';

import { Extension } from '@tiptap/core';
import { History } from '@tiptap/extension-history';

import { Document } from '@tiptap/extension-document';
import { Link } from '@tiptap/extension-link';
import { Mention, type MentionOptions } from '@tiptap/extension-mention';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Text } from '@tiptap/extension-text';

import { type ComputePositionConfig, type ComputePositionReturn, computePosition, size } from '@floating-ui/dom';
import { createTiptapEditor } from 'solid-tiptap';

import { posts as postsCache } from '~/api/cache.ts';
import { multiagent } from '~/api/global.ts';
import { createPost } from '~/api/mutation.ts';
import { getPost, getPostKey, getProfile, getProfileKey } from '~/api/query.ts';
import {
	type BskyPostRecord,
	type BskyPostRecordReply,
	type BskyProfileTypeaheadSearch,
	type BskySearchActorTypeaheadResponse,
} from '~/api/types.ts';
import { getPostId } from '~/api/utils.ts';

import { useNavigate, useParams } from '~/router.ts';

import '~/styles/compose.css';
import CircularProgress from '~/components/CircularProgress.tsx';
import Post from '~/components/Post.tsx';
import button from '~/styles/primitives/button.ts';

import { pm2rt } from '~/utils/composer/pm2rt.ts';
import { Locker } from '~/utils/lock.ts';

const MENTION_SUGGESTION_LIMIT = 6;
const GRAPHEME_LIMIT = 300;

const enum PostState {
	IDLE,
	DISPATCHING,
	SENT,
}

const AuthenticatedComposePage = () => {
	let ref: HTMLDivElement | undefined;

	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const params = useParams('/u/:uid/compose');

	const uid = () => params.uid;

	const replyUri = () => searchParams.reply;

	const [error, setError] = createSignal<string>();
	const [state, setState] = createSignal(PostState.IDLE);
	const [richtext, setRichtext] = createSignal<ReturnType<typeof pm2rt>>();

	const did = createMemo(() => multiagent.accounts[uid()].session.did);

	const replyQuery = createQuery({
		queryKey: () => getPostKey(uid(), replyUri()),
		queryFn: getPost,
		initialData () {
			const signalized = postsCache[replyUri()];
			return signalized?.deref();
		},
		get enabled () {
			return !!replyUri();
		},
	});

	const profileQuery = createQuery({
		queryKey: () => getProfileKey(uid(), did()),
		queryFn: getProfile,
	});

	const length = createMemo(() => {
		const rt = richtext();
		return rt ? rt.length : 0;
	});

	const isEnabled = createMemo(() => {
		const len = length();
		return !replyQuery.isInitialLoading && state() === PostState.IDLE && (len > 0 && len <= 300);
	});

	const handleSubmit = async () => {
		const rt = richtext();

		if (!rt || state() !== PostState.IDLE) {
			return;
		}

		const reply = replyQuery.data;
		let replyRecord: BskyPostRecord['reply'];

		if (reply) {
			const ref: BskyPostRecordReply = {
				cid: reply.cid,
				uri: reply.uri,
			};

			const parentRecord = reply.record.peek();
			const parentReply = parentRecord.reply;

			replyRecord = {
				root: parentReply?.root || ref,
				parent: ref,
			};
		}

		const record: BskyPostRecord = {
			$type: 'app.bsky.feed.post',
			createdAt: new Date().toISOString(),
			facets: rt.facets,
			text: rt.text,
			reply: replyRecord,
		};

		setError(undefined);
		setState(PostState.DISPATCHING);

		try {
			const response = await createPost(uid(), record);
			const pid = getPostId(response.uri);

			setState(PostState.SENT);

			navigate('/u/:uid/profile/:actor/post/:status', {
				replace: true,
				params: {
					uid: uid(),
					actor: did(),
					status: pid,
				},
			});
		}
		catch (err) {
			setError('' + err);
			setState(PostState.IDLE);
		}
	};

	const editor = createTiptapEditor(() => ({
		element: ref!,
		extensions: [
			Document,
			Paragraph,
			Text,

			History,

			Placeholder.configure({
				placeholder: 'What\'s happening?',
			}),

			Link.configure({
				protocols: ['http', 'https'],
				autolink: true,
				openOnClick: false,
			}),
			Mention.configure({
				suggestion: createMentionSuggestion(uid),
			}),

			Extension.create({
				addKeyboardShortcuts () {
					const submit = () => {
						handleSubmit();
						return true;
					};

					return {
						'Ctrl-Enter': submit,
						'Cmd-Enter': submit,
					};
				},
			}),
		],
		onUpdate ({ editor }) {
			const json = editor.getJSON();
			const rt = pm2rt(json);
			setRichtext(rt);
		},
	}));

	useBeforeLeave((ev) => {
		if (state() < PostState.SENT && length() > 0) {
			ev.preventDefault();

			if (window.confirm('Discard post?')) {
				ev.retry(true);
			}
		}
	});

	return (
		<div class='flex flex-col'>
			<div class='bg-background flex items-center h-13 px-4 border-b border-divider sticky top-0 z-10'>
				<p class='font-bold text-base'>Compose</p>
			</div>

			<Switch>
				<Match when={replyQuery.isInitialLoading}>
					<div class='h-13 flex items-center justify-center border-divider'>
						<CircularProgress />
					</div>
				</Match>

				<Match when={replyQuery.data}>
					{(reply) => <Post uid={uid()} post={reply()} next />}
				</Match>
			</Switch>

			<div class='flex pb-4'>
				<div class='shrink-0 p-4'>
					<div class='h-12 w-12 rounded-full bg-muted-fg overflow-hidden'>
						<Show when={profileQuery.data?.avatar.value}>
							{(avatar) => <img src={avatar()} class='h-full w-full' />}
						</Show>
					</div>
				</div>

				<div class='grow min-w-0'>
					<div ref={ref} class='compose-editor' />

					<div class='pr-3 pb-4 empty:hidden'>
						<Show when={error()}>
							{(msg) => (
								<div class='text-sm rounded-md border border-divider'>
									Failed to post: {msg()}
								</div>
							)}
						</Show>
					</div>

					<div class='flex items-center gap-3 px-3'>
						<div class='grow' />

						<span class='text-sm' classList={{ 'text-red-600': length() > GRAPHEME_LIMIT }}>
							{GRAPHEME_LIMIT - length()}
						</span>

						<button disabled={!isEnabled()} onClick={handleSubmit} class={button({ color: 'primary' })}>
							Post
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AuthenticatedComposePage;

// Mentions

const createMentionSuggestion = (uid: Accessor<string>): MentionOptions['suggestion'] => {
	const lock = new Locker<void>(undefined);

	let current = '';
	let suggestions: BskyProfileTypeaheadSearch[] = [];

	return {
		char: '@',
		async items ({ query }) {
			current = query;

			const handle = await lock.acquire();
			const agent = await multiagent.connect(uid());

			try {
				if (current !== query) {
					// Return because another search query has been set
					return suggestions;
				}

				const response = await agent.rpc.get({
					method: 'app.bsky.actor.searchActorsTypeahead',
					params: { term: query, limit: MENTION_SUGGESTION_LIMIT },
				});

				const data = response.data as BskySearchActorTypeaheadResponse;
				return suggestions = data.actors;
			}
			finally {
				handle.release();
			}
		},
		render () {
			let destroy: (() => void) | undefined;
			let onKeyDownRef: ((ev: KeyboardEvent) => boolean) | undefined;
			let popper: HTMLDivElement | undefined;

			const [items, setItems] = createSignal<BskyProfileTypeaheadSearch[]>([]);

			const floatOptions: Partial<ComputePositionConfig> = {
				strategy: 'fixed',
				placement: 'bottom-start',
				middleware: [
					size({
						padding: 12,
						apply ({ availableWidth, availableHeight, elements }) {
							Object.assign(elements.floating.style, {
								maxWidth: `${availableWidth}px`,
								maxHeight: `${availableHeight}px`,
							});
						},
					}),
				],
			};

			const applyFloat = ({ x, y }: ComputePositionReturn) => {
				Object.assign(popper!.style, {
					left: `${x}px`,
					top: `${y}px`,
				});
			};

			return {
				onKeyDown (props) {
					if (onKeyDownRef) {
						return onKeyDownRef(props.event);
					}

					return false;
				},
				onExit () {
					if (destroy) {
						destroy();
						popper!.remove();

						popper = undefined;
						onKeyDownRef = undefined;
						destroy = undefined;
					}
				},
				onUpdate (props) {
					const getBoundingClientRect = props.clientRect as (() => DOMRect) | null;

					setItems(props.items);

					if (popper && getBoundingClientRect) {
						computePosition({ getBoundingClientRect }, popper, floatOptions).then(applyFloat);
					}
				},
				onStart (props) {
					const command = props.command;
					const getBoundingClientRect = props.clientRect as (() => DOMRect) | null;

					setItems(props.items);

					popper = document.createElement('div');
					popper.className = 'fixed';
					document.body.append(popper);

					destroy = render(() => {
						const [selected, setSelected] = createSignal(0);

						const handleSelected = (idx: number) => {
							const arr = items();
							const item = arr[idx];

							if (item) {
								command({ label: item.handle, id: item.did });
							}
						};

						onKeyDownRef = (ev) => {
							const idx = selected();

							const arr = items();
							const len = arr.length;

							if (ev.key === 'ArrowUp') {
								setSelected((idx + len - 1) % len);
								return true;
							}

							if (ev.key === 'ArrowDown') {
								setSelected((idx + 1) % len);
								return true;
							}

							if (ev.key === 'Enter') {
								handleSelected(idx);
								return true;
							}

							return false;
						};

						return (
							<ul class='bg-background rounded-md overflow-hidden shadow-lg'>
								<For each={items()}>
									{(item, index) => (
										<li
											role='option'
											tabindex={-1}
											class='flex items-center gap-4 px-4 py-3 cursor-pointer'
											classList={{ 'bg-hinted': selected() === index() }}
											onMouseEnter={() => setSelected(index())}
											onClick={() => handleSelected(index())}
										>
											<div class='shrink-0 h-9 w-9 bg-muted-fg rounded-full overflow-hidden'>
												<Show when={item.avatar} keyed>
													{(avatar) => <img src={avatar} class='h-full w-full' />}
												</Show>
											</div>

											<div class='flex flex-col grow text-sm'>
												<span class='font-bold break-all whitespace-pre-wrap break-words line-clamp-1'>
													{item.displayName}
												</span>

												<span class='shrink-0 text-muted-fg break-all whitespace-pre-wrap line-clamp-1'>
													@{item.handle}
												</span>
											</div>
										</li>
									)}
								</For>
							</ul>
						);
					}, popper);

					if (getBoundingClientRect) {
						computePosition({ getBoundingClientRect }, popper, floatOptions).then(applyFloat);
					}
				},
			};
		},
	};
};

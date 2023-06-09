import { type Accessor, For, Match, Show, Switch, batch, createMemo, createSignal } from 'solid-js';
import { render } from 'solid-js/web';

import type { AtBlob, DID, Records, RefOf, UnionOf } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';
import { Title } from '@solidjs/meta';
import { useBeforeLeave, useSearchParams } from '@solidjs/router';

import { Extension } from '@tiptap/core';
import { History } from '@tiptap/extension-history';

import { Document } from '@tiptap/extension-document';
import { Link } from '@tiptap/extension-link';
import { Mention, type MentionOptions } from '@tiptap/extension-mention';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Text } from '@tiptap/extension-text';

import {
	type ComputePositionConfig,
	type ComputePositionReturn,
	computePosition,
	size,
} from '@floating-ui/dom';
import { createTiptapEditor } from 'solid-tiptap';

import { getRecordId } from '~/api/utils.ts';

import { createPost } from '~/api/mutations/create-post.ts';
import { uploadBlob } from '~/api/mutations/upload-blob.ts';
import {
	getFeedGenerator,
	getFeedGeneratorKey,
	getInitialFeedGenerator,
} from '~/api/queries/get-feed-generator.ts';
import { getLinkMeta, getLinkMetaKey } from '~/api/queries/get-link-meta';
import { getInitialPost, getPost, getPostKey } from '~/api/queries/get-post.ts';
import { getInitialProfile, getProfile, getProfileKey } from '~/api/queries/get-profile.ts';

import { multiagent } from '~/globals/agent.ts';
import { openModal } from '~/globals/modals.tsx';
import { systemLanguages } from '~/globals/platform.ts';
import { preferences } from '~/globals/preferences.ts';
import { useNavigate, useParams } from '~/router.ts';

import { pm2rt } from '~/utils/composer/pm2rt.ts';
import { createDerivedSignal } from '~/utils/hooks.ts';
import { compress } from '~/utils/image.ts';
import { languageNames } from '~/utils/intl/displaynames.ts';
import { isAtpFeedUri, isAtpPostUri, isBskyFeedUrl, isBskyPostUrl } from '~/utils/link.ts';
import { Locker } from '~/utils/lock.ts';
import { signal } from '~/utils/signals.ts';

import '~/styles/compose.css';
import ComposeLanguageMenu from '~/components/menus/ComposeLanguageMenu';
import BlobImage from '~/components/BlobImage.tsx';
import CircularProgress from '~/components/CircularProgress.tsx';
import EmbedFeed from '~/components/EmbedFeed.tsx';
import EmbedLink from '~/components/EmbedLink.tsx';
import EmbedRecord from '~/components/EmbedRecord.tsx';
import Post from '~/components/Post.tsx';
import button from '~/styles/primitives/button.ts';

import { type ComposedImage, type PendingImage } from '~/components/composer/types.ts';
import ImageAltEditDialog from '~/components/composer/ImageAltEditDialog.tsx';
import ImageUploadCompressDialog from '~/components/composer/ImageUploadCompressDialog.tsx';

import ArrowDropDownIcon from '~/icons/baseline-arrow-drop-down.tsx';
import CheckIcon from '~/icons/baseline-check.tsx';
import CloseIcon from '~/icons/baseline-close.tsx';
import ImageIcon from '~/icons/baseline-image.tsx';
import LanguageIcon from '~/icons/baseline-language.tsx';

type PostRecord = Records['app.bsky.feed.post'];
type StrongRef = RefOf<'com.atproto.repo.strongRef'>;

type PostRecordEmbed = UnionOf<'app.bsky.embed.record'>;

const MENTION_SUGGESTION_LIMIT = 6;
const GRAPHEME_LIMIT = 300;
const MAX_IMAGE = 4;

const enum PostState {
	IDLE,
	DISPATCHING,
	SENT,
}

const getLanguages = (uid: DID): Array<'none' | (string & {})> => {
	const lang = preferences.get(uid)?.cl_defaultLanguage ?? 'system';

	if (lang === 'none') {
		return [];
	}
	if (lang === 'system') {
		return [systemLanguages[0]];
	}

	return [lang];
};

const AuthenticatedComposePage = () => {
	let editorRef: HTMLDivElement | undefined;
	let fileInputRef: HTMLInputElement | undefined;

	const navigate = useNavigate();
	const [searchParams] = useSearchParams<{ quote?: string; reply?: string }>();
	const params = useParams('/u/:uid/compose');

	const uid = () => params.uid as DID;

	const replyUri = () => searchParams.reply;
	const quoteUri = () => searchParams.quote;

	const [recordUri, setRecordUri] = createDerivedSignal(quoteUri);
	const [linkUrl, setLinkUrl] = createSignal<string>();

	const [imageProcessing, setImageProcessing] = createSignal(0);
	const [images, setImages] = createSignal<ComposedImage[]>([]);

	const [languages, setLanguages] = createSignal(getLanguages(uid()));

	const [message, setMessage] = createSignal<string>();
	const [state, setState] = createSignal(PostState.IDLE);
	const [richtext, setRichtext] = createSignal<ReturnType<typeof pm2rt>>();

	const links = createMemo(() => richtext()?.links, undefined, {
		equals: (a, b) => {
			if (Array.isArray(a) && Array.isArray(b) && a.length == b.length) {
				for (let idx = a.length - 1; idx >= 0; idx--) {
					if (a[idx] !== b[idx]) {
						return false;
					}
				}

				return true;
			}

			return a === b;
		},
	});

	const [reply] = createQuery({
		key: () => getPostKey(uid(), replyUri()!),
		fetch: getPost,
		staleTime: 30_000,
		initialData: getInitialPost,
		enabled: () => {
			return !!replyUri();
		},
	});

	const [quote] = createQuery({
		key: () => getPostKey(uid(), recordUri()!),
		fetch: getPost,
		staleTime: 30_000,
		initialData: getInitialPost,
		enabled: () => {
			const uri = recordUri();
			return !!uri && (isAtpPostUri(uri) || isBskyPostUrl(uri));
		},
	});

	const [feed] = createQuery({
		key: () => getFeedGeneratorKey(uid(), recordUri()!),
		fetch: getFeedGenerator,
		staleTime: 30_000,
		initialData: getInitialFeedGenerator,
		enabled: () => {
			const uri = recordUri();
			return !!uri && (isAtpFeedUri(uri) || isBskyFeedUrl(uri));
		},
	});

	const [link] = createQuery({
		key: () => getLinkMetaKey(linkUrl()!),
		fetch: getLinkMeta,
		staleTime: 30_000,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
		enabled: () => !!linkUrl(),
	});

	const [profile] = createQuery({
		key: () => getProfileKey(uid(), uid()),
		fetch: getProfile,
		staleTime: 10_000,
		refetchOnMount: true,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
		initialData: getInitialProfile,
	});

	const length = createMemo(() => {
		const rt = richtext();
		return rt ? rt.length : 0;
	});

	const isEnabled = createMemo(() => {
		return (
			reply.state !== 'pending' &&
			quote.state !== 'pending' &&
			feed.state !== 'pending' &&
			state() === PostState.IDLE &&
			((length() > 0 && length() <= 300) || images().length > 0)
		);
	});

	const handleSubmit = async () => {
		const rt = richtext();

		if (state() !== PostState.IDLE || !(rt || images().length > 0)) {
			return;
		}

		setState(PostState.DISPATCHING);

		const $reply = reply();
		const $quote = quote() || feed();
		const $link = link();
		const $images = images();

		let replyRecord: PostRecord['reply'];
		let embedRecord: PostRecord['embed'];

		if ($reply) {
			const ref: StrongRef = {
				cid: $reply.cid.value,
				uri: $reply.uri,
			};

			const parentRecord = $reply.record.peek();
			const parentReply = parentRecord.reply;

			replyRecord = {
				root: parentReply?.root || ref,
				parent: ref,
			};
		}

		if ($images.length > 0) {
			// iterate through images, upload ones that haven't been uploaded,
			// they're marked by whether or not it has the blob record saved.
			for (let idx = 0, len = $images.length; idx < len; idx++) {
				const img = $images[idx];

				if (img.record) {
					continue;
				}

				setMessage(`Uploading image #${idx + 1}`);

				try {
					const blob = await uploadBlob(uid(), img.blob);

					img.record = blob;
				} catch (err) {
					console.error(`Failed to upload image`, err);

					setMessage(`Failed to upload image #${idx + 1}`);
					setState(PostState.IDLE);
					return;
				}
			}

			embedRecord = {
				$type: 'app.bsky.embed.images',
				images: $images.map((img) => ({
					alt: img.alt.value,
					image: img.record! as AtBlob<`image/${string}`>,
				})),
			};
		} else if ($link) {
			if ($link.thumb && !$link.record) {
				setMessage(`Uploading link thumbnail`);

				try {
					const blob = await uploadBlob(uid(), $link.thumb);

					$link.record = blob;
				} catch (err) {
					console.error(`Failed to upload image`, err);

					setMessage(`Failed to upload link thumbnail`);
					setState(PostState.IDLE);
					return;
				}
			}

			embedRecord = {
				$type: 'app.bsky.embed.external',
				external: {
					uri: $link.uri,
					title: $link.title,
					description: $link.description,
					thumb: $link.record as any,
				},
			};
		}

		if ($quote) {
			const rec: PostRecordEmbed = {
				$type: 'app.bsky.embed.record',
				record: {
					cid: $quote.cid.value,
					uri: $quote.uri,
				},
			};

			if (embedRecord && embedRecord.$type === 'app.bsky.embed.images') {
				embedRecord = {
					$type: 'app.bsky.embed.recordWithMedia',
					media: embedRecord,
					record: rec,
				};
			} else {
				embedRecord = rec;
			}
		}

		setMessage(undefined);

		const record: PostRecord = {
			createdAt: new Date().toISOString(),
			facets: rt ? rt.facets : undefined,
			text: rt ? rt.text : '',
			reply: replyRecord,
			embed: embedRecord,
			langs: languages(),
		};

		try {
			const response = await createPost(uid(), record);
			const pid = getRecordId(response.uri);

			setState(PostState.SENT);

			navigate('/u/:uid/profile/:actor/post/:status', {
				replace: true,
				params: {
					uid: uid(),
					actor: uid(),
					status: pid,
				},
			});
		} catch (err) {
			setMessage(`Failed to post: ${err}`);
			setState(PostState.IDLE);
		}
	};

	const addImagesUncompressed = (files: (Blob | File)[]) => {
		const next: ComposedImage[] = [];

		for (let idx = 0, len = files.length; idx < len; idx++) {
			const file = files[idx];

			next.push({
				blob: file,
				alt: signal(''),
				record: undefined,
			});
		}

		setLinkUrl(undefined);
		setImages(images().concat(next));
	};

	const addImages = async (files: (Blob | File)[]) => {
		if (images().length + files.length > MAX_IMAGE) {
			setMessage(`You can only add up to 4 images in a single post`);
			return;
		}

		const pending: PendingImage[] = [];
		const next: (Blob | File)[] = [];
		let errored = false;

		setMessage('');
		setImageProcessing(imageProcessing() + 1);

		for (let idx = 0, len = files.length; idx < len; idx++) {
			const file = files[idx];

			if (!file.type.startsWith('image/')) {
				continue;
			}

			try {
				const compressed = await compress(file);

				const blob = compressed.blob;
				const before = compressed.before;
				const after = compressed.after;

				if (after.size !== before.size) {
					pending.push({ ...compressed, name: file.name });
				} else {
					next.push(blob);
				}
			} catch (err) {
				console.error(`Failed to compress image`, err);
				errored = true;
			}
		}

		batch(() => {
			setImageProcessing(imageProcessing() - 1);
			addImagesUncompressed(next);

			if (pending.length > 0) {
				openModal(() => (
					<ImageUploadCompressDialog
						images={pending}
						onSubmit={() => addImagesUncompressed(pending.map((img) => img.blob))}
					/>
				));
			}

			if (errored) {
				setMessage(`Failed to add some of your images, please try again.`);
			}
		});
	};

	const handleFileInput = async (ev: Event) => {
		const target = ev.currentTarget as HTMLInputElement;
		const files = Array.from(target.files!);

		target.value = '';
		editor()!.view.focus();

		addImages(files);
	};

	const editor = createTiptapEditor(() => ({
		element: editorRef!,
		extensions: [
			Document,
			Paragraph,
			Text,

			History,

			Placeholder.configure({
				placeholder: "What's happening?",
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
				addKeyboardShortcuts() {
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
		editorProps: {
			handlePaste(_view, event) {
				const items = event.clipboardData?.items;

				if (!items) {
					return;
				}

				for (let idx = 0, len = items.length; idx < len; idx++) {
					const item = items[idx];
					const kind = item.kind;

					if (kind === 'file') {
						const blob = item.getAsFile();

						if (blob) {
							addImages([blob]);
						}
					}
				}
			},
		},
		onUpdate({ editor }) {
			const json = editor.getJSON();
			const rt = pm2rt(json);
			setRichtext(rt);
		},
	}));

	useBeforeLeave((ev) => {
		if (state() < PostState.SENT && (length() > 0 || images().length > 0)) {
			ev.preventDefault();

			if (window.confirm('Discard post?')) {
				ev.retry(true);
			}
		}
	});

	return (
		<div class="flex flex-col">
			<Title>Compose / Langit</Title>

			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Compose</p>
			</div>

			<input
				ref={fileInputRef}
				type="file"
				multiple
				accept="image/*"
				onChange={handleFileInput}
				class="hidden"
			/>

			<Switch>
				<Match when={reply()}>{(reply) => <Post uid={uid()} post={reply()} next />}</Match>

				<Match when={reply.loading}>
					<div class="flex h-13 items-center justify-center border-divider">
						<CircularProgress />
					</div>
				</Match>
			</Switch>

			<div class="flex pb-4">
				<div class="shrink-0 p-4">
					<div class="h-10 w-10 overflow-hidden rounded-full bg-muted-fg">
						<Show when={profile()?.avatar.value}>
							{(avatar) => <img src={avatar()} class="h-full w-full" />}
						</Show>
					</div>
				</div>

				<div class="min-w-0 grow">
					<div ref={editorRef} class="compose-editor" />

					<div class="pb-4 pr-3 empty:hidden">
						<Show when={message()}>
							{(msg) => <div class="rounded-md border border-divider px-3 py-2 text-sm">{msg()}</div>}
						</Show>
					</div>

					<Switch>
						<Match when={quote()}>
							{(data) => {
								const author = () => data().author;
								const record = () => data().record.value;

								return (
									<div class="mb-3 mr-3 flex flex-col">
										<EmbedRecord
											uid={uid()}
											record={{
												$type: 'app.bsky.embed.record#viewRecord',
												// @ts-expect-error
												cid: null,
												// @ts-expect-error
												indexedAt: null,
												uri: data().uri,
												author: {
													did: author().did,
													avatar: author().avatar.value,
													handle: author().handle.value,
													displayName: author().handle.value,
												},
												embeds: data().embed.value ? [data().embed.value!] : [],
												value: {
													createdAt: record().createdAt,
													text: record().text,
												},
											}}
										/>
									</div>
								);
							}}
						</Match>

						<Match when={feed()}>
							{(data) => {
								return (
									<div class="mb-3 mr-3 flex flex-col">
										<EmbedFeed
											uid={uid()}
											feed={{
												$type: 'app.bsky.feed.defs#generatorView',
												// @ts-expect-error
												cid: null,
												// @ts-expect-error
												did: null,
												// @ts-expect-error
												indexedAt: null,
												uri: data().uri,
												avatar: data().avatar.value,
												displayName: data().displayName.value,
												creator: {
													did: data().creator.did,
													handle: data().creator.handle.value,
												},
												likeCount: data().likeCount.value,
											}}
										/>
									</div>
								);
							}}
						</Match>

						<Match when={quote.loading || feed.loading}>
							<div class="mb-3 mr-3 flex items-center justify-center rounded-md border border-divider p-4">
								<CircularProgress />
							</div>
						</Match>
					</Switch>

					<Switch>
						<Match when={images().length > 0}>
							<div class="flex flex-wrap gap-3 pb-4 pr-3">
								<For each={images()}>
									{(image, idx) => (
										<div class="relative">
											<BlobImage src={image.blob} class="h-32 w-32 rounded-md object-cover" />

											<button
												title="Remove image"
												disabled={!isEnabled()}
												onClick={() => {
													const next = images().slice();
													next.splice(idx(), 1);

													setImages(next);
												}}
												class="absolute right-0 top-0 m-1 flex h-7 w-7 items-center justify-center rounded-full bg-black text-base hover:bg-secondary"
											>
												<CloseIcon />
											</button>

											<button
												title="Add image description"
												onClick={() => {
													openModal(() => <ImageAltEditDialog image={image} />);
												}}
												class="absolute bottom-0 left-0 m-1 flex h-5 items-center rounded bg-black/70 px-1 text-xs font-medium"
											>
												<span>ALT</span>
												{image.alt.value && <CheckIcon class="ml-1" />}
											</button>
										</div>
									)}
								</For>
							</div>
						</Match>

						<Match when={link.state === 'pending'}>
							<div class="mb-3 mr-3 flex items-center justify-between gap-3 rounded-md border border-divider p-3 pl-4">
								<CircularProgress />

								<button
									disabled={!isEnabled()}
									onClick={() => setLinkUrl(undefined)}
									class={/* @once */ button({ color: 'primary' })}
								>
									Remove
								</button>
							</div>
						</Match>

						<Match when={link.error}>
							{(error) => (
								<div class="mb-3 mr-3 flex items-center justify-between gap-3 rounded-md border border-divider p-3">
									<div class="grow text-sm">
										<p>Error adding link card</p>
										<p class="text-muted-fg">{'' + ((error() as any)?.message || error())}</p>
									</div>

									<button
										disabled={!isEnabled()}
										onClick={() => setLinkUrl(undefined)}
										class={/* @once */ button({ color: 'primary' })}
									>
										Remove
									</button>
								</div>
							)}
						</Match>

						<Match when={link()}>
							{(data) => {
								return (
									<div class="relative mb-3 mr-3 flex flex-col">
										<EmbedLink
											link={{
												title: data().title,
												description: data().description,
												uri: data().uri,
												thumb: data().thumb,
											}}
										/>

										<button
											title="Remove link card"
											disabled={!isEnabled()}
											onClick={() => setLinkUrl(undefined)}
											class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-fg"
										>
											<CloseIcon />
										</button>
									</div>
								);
							}}
						</Match>

						<Match when={links()}>
							{(links) => (
								<div class="mb-3 mr-3 flex flex-col gap-3 empty:hidden">
									<For each={links()}>
										{(link) => {
											const isRecord = isBskyPostUrl(link) || isBskyFeedUrl(link);

											return (
												<button
													onClick={() => {
														if (isRecord) {
															setRecordUri(link);
														} else {
															setLinkUrl(link);
														}
													}}
													class="overflow-hidden text-ellipsis whitespace-nowrap rounded-md border border-divider px-3 py-3 text-left text-sm hover:bg-hinted"
												>
													<span>Add link card: </span>
													<span class="text-accent">{link}</span>
												</button>
											);
										}}
									</For>
								</div>
							)}
						</Match>
					</Switch>

					<div class="mr-3 flex flex-wrap items-center justify-end gap-2 border-t border-divider pt-3">
						<Show
							when={imageProcessing() < 1}
							fallback={
								<div class="flex h-9 w-9 items-center justify-center">
									<CircularProgress />
								</div>
							}
						>
							<button
								title="Add image"
								onClick={() => fileInputRef!.click()}
								class="flex h-9 w-9 items-center justify-center rounded-full text-lg hover:bg-hinted"
							>
								<ImageIcon />
							</button>
						</Show>

						<div class="grow" />

						<span class="text-sm text-muted-fg" classList={{ 'text-red-600': length() > GRAPHEME_LIMIT }}>
							{GRAPHEME_LIMIT - length()}
						</span>

						<button
							onClick={() => {
								openModal(() => <ComposeLanguageMenu languages={languages()} onChange={setLanguages} />);
							}}
							class="flex h-9 items-center rounded-md px-2 text-sm hover:bg-hinted"
						>
							{(() => {
								const $languages = languages();

								if ($languages.length > 0) {
									return (
										<>
											<span>
												{$languages.length > 1 ? $languages.join(', ') : languageNames.of($languages[0])}
											</span>
											<ArrowDropDownIcon class="-mr-1.5 text-lg" />
										</>
									);
								} else {
									return <LanguageIcon aria-label="Language not set" class="mx-px text-lg" />;
								}
							})()}
						</button>

						<button
							disabled={!isEnabled()}
							onClick={handleSubmit}
							class={/* @once */ button({ color: 'primary' })}
						>
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
const createMentionSuggestion = (uid: Accessor<DID>): MentionOptions['suggestion'] => {
	const lock = new Locker<void>(undefined);

	let current = '';
	let suggestions: RefOf<'app.bsky.actor.defs#profileViewBasic'>[] = [];

	return {
		char: '@',
		async items({ query }) {
			current = query;

			const handle = await lock.acquire();
			const agent = await multiagent.connect(uid());

			try {
				if (current !== query) {
					// Return because another search query has been set
					return suggestions;
				}

				const response = await agent.rpc.get('app.bsky.actor.searchActorsTypeahead', {
					params: {
						term: query,
						limit: MENTION_SUGGESTION_LIMIT,
					},
				});

				return (suggestions = response.data.actors);
			} finally {
				handle.release();
			}
		},
		render() {
			let destroy: (() => void) | undefined;
			let onKeyDownRef: ((ev: KeyboardEvent) => boolean) | undefined;
			let popper: HTMLDivElement | undefined;

			const [items, setItems] = createSignal<RefOf<'app.bsky.actor.defs#profileViewBasic'>[]>([]);

			const floatOptions: Partial<ComputePositionConfig> = {
				strategy: 'fixed',
				placement: 'bottom-start',
				middleware: [
					size({
						padding: 12,
						apply({ availableWidth, availableHeight, elements }) {
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
				onKeyDown(props) {
					if (onKeyDownRef) {
						return onKeyDownRef(props.event);
					}

					return false;
				},
				onExit() {
					if (destroy) {
						destroy();
						popper!.remove();

						popper = undefined;
						onKeyDownRef = undefined;
						destroy = undefined;
					}
				},
				onUpdate(props) {
					const getBoundingClientRect = props.clientRect as (() => DOMRect) | null;

					setItems(props.items);

					if (popper && getBoundingClientRect) {
						computePosition({ getBoundingClientRect }, popper, floatOptions).then(applyFloat);
					}
				},
				onStart(props) {
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
							<ul class="overflow-hidden rounded-md bg-background shadow-lg">
								<For each={items()}>
									{(item, index) => (
										<li
											role="option"
											tabindex={-1}
											class="flex cursor-pointer items-center gap-4 px-4 py-3"
											classList={{ 'bg-hinted': selected() === index() }}
											onMouseEnter={() => setSelected(index())}
											onClick={() => handleSelected(index())}
										>
											<div class="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted-fg">
												<Show when={item.avatar} keyed>
													{(avatar) => <img src={avatar} class="h-full w-full" />}
												</Show>
											</div>

											<div class="flex grow flex-col text-sm">
												<span class="line-clamp-1 break-all font-bold">{item.displayName}</span>

												<span class="line-clamp-1 shrink-0 break-all text-muted-fg">@{item.handle}</span>
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

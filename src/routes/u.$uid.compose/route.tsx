import { For, Match, Show, Switch, batch, createMemo, createSignal } from 'solid-js';

import type { AtBlob, DID, Records, RefOf, UnionOf } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';
import { useBeforeLeave, useSearchParams } from '@solidjs/router';

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

import { finalizeRt, getRtLength, textToPrelimRt } from '~/api/richtext/composer.ts';

import { getCurrentDate, getRecordId } from '~/api/utils.ts';

import { openModal } from '~/globals/modals.tsx';
import { systemLanguages } from '~/globals/platform.ts';
import { preferences } from '~/globals/preferences.ts';
import { useNavigate, useParams } from '~/router.ts';

import { createDerivedSignal } from '~/utils/hooks.ts';
import { compressPostImage } from '~/utils/image.ts';
import { languageNames } from '~/utils/intl/displaynames.ts';
import { isAtpFeedUri, isAtpPostUri, isBskyFeedUrl, isBskyPostUrl } from '~/utils/link.ts';
import { Title } from '~/utils/meta.tsx';
import { signal } from '~/utils/signals.ts';

import BlobImage from '~/components/BlobImage.tsx';
import CircularProgress from '~/components/CircularProgress.tsx';
import EmbedFeed from '~/components/EmbedFeed.tsx';
import EmbedLink from '~/components/EmbedLink.tsx';
import EmbedRecord from '~/components/EmbedRecord.tsx';
import Post from '~/components/Post.tsx';
import button from '~/styles/primitives/button.ts';

import ArrowDropDownIcon from '~/icons/baseline-arrow-drop-down.tsx';
import CheckIcon from '~/icons/baseline-check.tsx';
import CloseIcon from '~/icons/baseline-close.tsx';
import ImageIcon from '~/icons/baseline-image.tsx';
import LanguageIcon from '~/icons/baseline-language.tsx';
import ShieldIcon from '~/icons/baseline-shield.tsx';

import { type ComposedImage, type PendingImage } from './types.ts';
import AddSelfLabelDialog from './AddSelfLabelDialog.tsx';
import ComposeLanguageMenu from './ComposeLanguageMenu.tsx';
import ImageAltEditDialog from './ImageAltEditDialog.tsx';
import ImageUploadCompressDialog from './ImageUploadCompressDialog.tsx';
import RichtextComposer from '~/components/richtext/RichtextComposer.tsx';

type PostRecord = Records['app.bsky.feed.post'];
type StrongRef = RefOf<'com.atproto.repo.strongRef'>;

type PostRecordEmbed = UnionOf<'app.bsky.embed.record'>;

const GRAPHEME_LIMIT = 300;
const MAX_IMAGE = 4;

const enum PostState {
	IDLE,
	DISPATCHING,
	SENT,
}

const getLanguages = (uid: DID): string[] => {
	const lang = preferences[uid]?.cl_defaultLanguage ?? 'system';

	if (lang === 'none') {
		return [];
	}
	if (lang === 'system') {
		return [systemLanguages[0]];
	}

	return [lang];
};

const AuthenticatedComposePage = () => {
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

	const [labels, setLabels] = createSignal<string[]>([]);
	const [languages, setLanguages] = createSignal(getLanguages(uid()));

	const [message, setMessage] = createSignal<string>();
	const [state, setState] = createSignal(PostState.IDLE);

	const [input, setInput] = createSignal('');
	const prelimRichtext = createMemo(() => textToPrelimRt(input()));

	const links = createMemo(() => prelimRichtext()?.links, undefined, {
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
		const rt = prelimRichtext();
		return getRtLength(rt);
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
		const rt = prelimRichtext();

		if (state() !== PostState.IDLE || !(length() > 0 || images().length > 0)) {
			return;
		}

		setState(PostState.DISPATCHING);

		const $uid = uid();

		const $reply = reply();
		const $quote = quote() || feed();
		const $link = link();
		const $images = images();

		const $languages = languages();
		const $labels = labels();

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
					const blob = await uploadBlob($uid, img.blob);

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
					aspectRatio: img.ratio,
				})),
			};
		} else if ($link) {
			if ($link.thumb && !$link.record) {
				setMessage(`Uploading link thumbnail`);

				try {
					const blob = await uploadBlob($uid, $link.thumb);

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

		if (!(rt as any).res) {
			try {
				(rt as any).res = await finalizeRt($uid, rt);
			} catch (err) {
				console.error(`Failed to resolve facets`, err);

				setMessage(`Failed to resolve facets`);
				setState(PostState.IDLE);
				return;
			}
		}

		setMessage(undefined);

		const record: PostRecord = {
			createdAt: getCurrentDate(),
			facets: (rt as any).res.facets,
			text: (rt as any).res.text,
			reply: replyRecord,
			embed: embedRecord,
			langs: $languages.length > 0 ? $languages : undefined,
			labels:
				$labels.length > 0
					? { $type: 'com.atproto.label.defs#selfLabels', values: $labels.map((value) => ({ val: value })) }
					: undefined,
		};

		try {
			const response = await createPost($uid, record);
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

	const addImagesRaw = (imgs: Array<{ blob: Blob; ratio: { width: number; height: number } }>) => {
		const next: ComposedImage[] = [];

		for (let idx = 0, len = imgs.length; idx < len; idx++) {
			const img = imgs[idx];

			next.push({
				blob: img.blob,
				ratio: img.ratio,
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
		const next: Array<{ blob: Blob; ratio: { width: number; height: number } }> = [];
		let errored = false;

		setMessage('');
		setImageProcessing(imageProcessing() + 1);

		for (let idx = 0, len = files.length; idx < len; idx++) {
			const file = files[idx];

			if (!file.type.startsWith('image/')) {
				continue;
			}

			try {
				const compressed = await compressPostImage(file);

				const blob = compressed.blob;
				const before = compressed.before;
				const after = compressed.after;

				if (after.size !== before.size) {
					pending.push({ ...compressed, name: file.name });
				} else {
					next.push({ blob: blob, ratio: { width: after.width, height: after.height } });
				}
			} catch (err) {
				console.error(`Failed to compress image`, err);
				errored = true;
			}
		}

		batch(() => {
			setImageProcessing(imageProcessing() - 1);
			addImagesRaw(next);

			if (pending.length > 0) {
				openModal(() => (
					<ImageUploadCompressDialog
						images={pending}
						onSubmit={() =>
							addImagesRaw(
								pending.map((img) => ({
									blob: img.blob,
									ratio: {
										width: img.after.width,
										height: img.after.height,
									},
								})),
							)
						}
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

		addImages(files);
	};

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
			<Title render="Compose / Langit" />

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
					<RichtextComposer
						uid={uid()}
						value={input()}
						rt={prelimRichtext()}
						placeholder="What's happening?"
						minRows={4}
						onChange={setInput}
						onSubmit={handleSubmit}
						onImageDrop={addImages}
					/>

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
													displayName: author().displayName.value,
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

													// TODO: remove this when there are labels that can
													// be applied for non-media content.
													if (next.length === 0) {
														setLabels([]);
													}
												}}
												class="absolute right-0 top-0 m-1 flex h-7 w-7 items-center justify-center rounded-full bg-black text-base text-white hover:bg-secondary"
											>
												<CloseIcon />
											</button>

											<button
												title="Add image description"
												onClick={() => {
													openModal(() => <ImageAltEditDialog image={image} />);
												}}
												class="absolute bottom-0 left-0 m-1 flex h-5 items-center rounded bg-black/70 px-1 text-xs font-medium text-white"
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

						<Show when={images().length > 0}>
							<button
								title="Add content warning"
								onClick={() => {
									openModal(() => <AddSelfLabelDialog labels={labels()} onApply={setLabels} />);
								}}
								class="flex h-9 w-9 items-center justify-center rounded-full text-lg hover:bg-hinted"
								classList={{ 'text-accent': labels().length > 0 }}
							>
								<ShieldIcon />
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

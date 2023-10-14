import { ErrorBoundary, For, Show, Suspense, createMemo, createResource, createSignal } from 'solid-js';

import type { DID, RefOf } from '@intrnl/bluesky-client/atp-schema';
import { makeEventListener } from '@solid-primitives/event-listener';

import TextareaAutosize from 'solid-textarea-autosize';

import type { PreliminaryRichText } from '~/api/richtext/composer.ts';

import { multiagent } from '~/globals/agent.ts';
import { useDebouncedValue } from '~/utils/hooks.ts';

import CircularProgress from '~/components/CircularProgress.tsx';

export interface RichtextComposerProps {
	uid: DID;

	value: string;
	rt: PreliminaryRichText;
	onChange: (next: string) => void;
	onSubmit: () => void;
	onImageDrop: (blob: Blob[]) => void;

	minRows?: number;
	placeholder?: string;
}

const MENTION_AUTOCOMPLETE_RE = /(?<=^|\s)@([a-zA-Z0-9-.]+)$/;
const TRIM_MENTION_RE = /[.]+$/;

const RichtextComposer = (props: RichtextComposerProps) => {
	let textarea: HTMLTextAreaElement | undefined;

	const [showDrop, setShowDrop] = createSignal(false);

	const [inputSelection, setInputSelection] = createSignal<number>();
	const [menuSelection, setMenuSelection] = createSignal<number>();

	const candidateMatch = createMemo(() => {
		const $val = props.value;
		const $sel = inputSelection();

		if ($sel == null) {
			return '';
		}

		return $val.length === $sel ? $val : $val.slice(0, $sel);
	});

	const matchedMention = createMemo(() => {
		const $candidate = candidateMatch();
		const match = MENTION_AUTOCOMPLETE_RE.exec($candidate);

		if (match) {
			return { index: match.index, length: match[0].length, query: match[1].replace(TRIM_MENTION_RE, '') };
		}

		return null;
	});

	const debouncedMatchedMention = useDebouncedValue(matchedMention, 500, (a, b) => a?.query === b?.query);
	const [mentionSuggestions] = createResource(debouncedMatchedMention, async (match) => {
		const $uid = props.uid;
		const agent = await multiagent.connect($uid);

		const response = await agent.rpc.get('app.bsky.actor.searchActorsTypeahead', {
			params: {
				q: match.query,
				limit: 5,
			},
		});

		return response.data.actors;
	});

	const acceptMentionSuggestion = (item: RefOf<'app.bsky.actor.defs#profileViewBasic'>) => {
		const $match = matchedMention();

		if (!$match) {
			return;
		}

		const $value = props.value;

		const pre = $value.slice(0, $match.index);
		const text = `@${item.handle} `;
		const post = $value.slice($match.index + $match.length);

		const final = pre + text + post;
		const cursor = $match.index + text.length;

		props.onChange(final);

		textarea!.setSelectionRange(cursor, cursor);
		textarea!.focus();
	};

	const handleSelectionChange = () => {
		const start = textarea!.selectionStart;
		const end = textarea!.selectionEnd;

		setInputSelection(start === end ? start : undefined);
	};

	makeEventListener(document, 'selectionchange', () => {
		if (document.activeElement !== textarea) {
			return;
		}

		handleSelectionChange();
	});

	return (
		<div class="relative">
			<div class="absolute inset-0 z-0 whitespace-pre-wrap break-words pb-4 pr-3 pt-5 text-xl">
				{props.rt.segments.map((segment) => {
					const feature = segment.feature;

					if (feature) {
						const node = document.createElement('span');
						node.textContent = segment.orig;
						node.className = 'text-accent';
						return node;
					}

					return segment.orig;
				})}
			</div>

			<TextareaAutosize
				ref={textarea}
				value={props.value}
				placeholder={props.placeholder}
				minRows={props.minRows}
				class="relative z-10 block w-full resize-none overflow-hidden bg-transparent pb-4 pr-3 pt-5 text-xl text-transparent caret-primary outline-none selection:bg-accentDark selection:text-white"
				onPaste={(ev) => {
					const items = ev.clipboardData?.items ?? [];
					let images: Blob[] = [];

					for (let idx = 0, len = items.length; idx < len; idx++) {
						const item = items[idx];

						if (item.kind === 'file' && item.type.startsWith('image/')) {
							const blob = item.getAsFile();

							if (blob) {
								images.push(blob);
							}
						}
					}

					if (images.length > 0) {
						ev.preventDefault();
						props.onImageDrop(images);
					}
				}}
				onDragOver={(ev) => {
					const dataTransfer = ev.dataTransfer;
					if (dataTransfer && dataTransfer.types.includes('Files')) {
						setShowDrop(true);
					}
				}}
				onDragLeave={() => {
					setShowDrop(false);
				}}
				onDrop={(ev) => {
					const dataTransfer = ev.dataTransfer;
					if (dataTransfer && dataTransfer.types.includes('Files')) {
						const files = dataTransfer.files;

						let images: Blob[] = [];
						for (let idx = 0, len = files.length; idx < len; idx++) {
							const file = files[idx];

							if (file.type.startsWith('image/')) {
								images.push(file);
							}
						}

						if (images.length > 0) {
							ev.preventDefault();
							props.onImageDrop(images);
						}
					}

					setShowDrop(false);
				}}
				onInput={(ev) => {
					props.onChange(ev.target.value);
					setMenuSelection(undefined);
					handleSelectionChange();
				}}
				onKeyDown={(ev) => {
					const key = ev.key;

					if (matchedMention()) {
						const $sel = menuSelection();
						const $suggestions = !mentionSuggestions.error && mentionSuggestions();

						if ($suggestions) {
							if (key === 'ArrowUp') {
								ev.preventDefault();
								setMenuSelection($sel == null ? $suggestions.length - 1 : $sel <= 0 ? undefined : $sel - 1);
							} else if (key === 'ArrowDown') {
								ev.preventDefault();

								setMenuSelection(($sel == null || $sel >= $suggestions.length - 1 ? -1 : $sel) + 1);
							} else if ($sel != null && key === 'Enter') {
								const item = $suggestions[$sel];

								ev.preventDefault();
								if (item) {
									acceptMentionSuggestion(item);
								}
							}
						}

						return;
					}

					if (key === 'Enter' && ev.ctrlKey) {
						// There shouldn't be a need, but might as well.
						ev.preventDefault();
						props.onSubmit();

						return;
					}
				}}
			/>

			<Show when={showDrop()}>
				<div class="pointer-events-none absolute inset-0 border-2 border-dashed border-accent"></div>
			</Show>

			<Show when={matchedMention()}>
				<ul
					class="absolute z-40 overflow-hidden rounded-md border border-divider bg-background shadow-lg empty:hidden"
					style={{ top: 'calc(100% - 12px)', 'max-width': '80%' }}
				>
					<ErrorBoundary fallback={null}>
						<Suspense
							fallback={
								<div class="flex h-14 w-64 items-center justify-center">
									<CircularProgress />
								</div>
							}
						>
							<For each={mentionSuggestions()}>
								{(item, index) => {
									const selected = () => menuSelection() === index();

									return (
										<li
											role="option"
											tabIndex={-1}
											aria-selected={selected()}
											onClick={() => {
												acceptMentionSuggestion(item);
											}}
											onMouseEnter={() => {
												setMenuSelection(index());
											}}
											class="flex cursor-pointer items-center gap-4 px-4 py-2"
											classList={{ 'bg-hinted': selected() }}
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
									);
								}}
							</For>
						</Suspense>
					</ErrorBoundary>
				</ul>
			</Show>
		</div>
	);
};

export default RichtextComposer;

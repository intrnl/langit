import {
	For,
	Match,
	Show,
	Switch,
	createEffect,
	createMemo,
	createResource,
	createSignal,
	onMount,
	untrack,
} from 'solid-js';
import type { JSX } from 'solid-js/jsx-runtime';

import type { DID, RefOf } from '@intrnl/bluesky-client/atp-schema';
import { makeEventListener } from '@solid-primitives/event-listener';

import { autoPlacement, autoUpdate, offset } from '@floating-ui/dom';

import { useFloating } from 'solid-floating-ui';
import TextareaAutosize from 'solid-textarea-autosize';

import type { PreliminaryRichText } from '~/api/richtext/composer.ts';

import { multiagent } from '~/globals/agent.ts';
import { useDebouncedValue } from '~/utils/hooks.ts';
import { assert } from '~/utils/misc.ts';

import CircularProgress from '~/components/CircularProgress.tsx';

import emojiListJson from '~/assets/emoji.json?url';

export interface RichtextComposerProps {
	uid: DID;

	value: string;
	rt: PreliminaryRichText;
	onChange: (next: string) => void;
	onSubmit: () => void;
	onImageDrop: (blob: File[]) => void;

	minRows?: number;
	placeholder?: string;
}

const MENTION_AUTOCOMPLETE_RE = /(?<=^|\s)@([a-zA-Z0-9-.]+)$/;
const EMOJI_AUTOCOMPLETE_RE = /(?<=^|\s):([a-zA-Z0-9+-_]+)$/;
const TRIM_MENTION_RE = /[.]+$/;

const findNodePosition = (node: Node, position: number): { node: Node; position: number } | undefined => {
	if (node.nodeType === Node.TEXT_NODE) {
		return { node, position };
	}

	const children = node.childNodes;
	for (let idx = 0, len = children.length; idx < len; idx++) {
		const child = children[idx];
		const textContentLength = child.textContent!.length;

		if (position <= textContentLength!) {
			return findNodePosition(child, position);
		}

		position -= textContentLength!;
	}

	return undefined;
};

let emojiPromise: Promise<[string, string][]> | undefined;

const enum Suggestion {
	MENTION,
	EMOJI,
}

interface EmojiSuggestionItem {
	type: Suggestion.EMOJI;
	name: string;
	emoji: string;
}

interface MentionSuggestionItem {
	type: Suggestion.MENTION;
	data: RefOf<'app.bsky.actor.defs#profileViewBasic'>;
}

type SuggestionItem = EmojiSuggestionItem | MentionSuggestionItem;

const RichtextComposer = (props: RichtextComposerProps) => {
	let textarea: HTMLTextAreaElement | undefined;
	let renderer: HTMLDivElement | undefined;

	const [showDrop, setShowDrop] = createSignal(false);

	const [inputCursor, setInputCursor] = createSignal<number>();
	const [menuSelection, setMenuSelection] = createSignal<number>();

	const candidateMatch = createMemo(() => {
		const $cursor = inputCursor();
		const $val = untrack(() => props.value);

		if ($cursor == null) {
			return '';
		}

		return $val.length === $cursor ? $val : $val.slice(0, $cursor);
	});

	const matchedCompletion = createMemo(() => {
		const $candidate = candidateMatch();

		let match: RegExpExecArray | null;
		let type: Suggestion;

		if ((match = MENTION_AUTOCOMPLETE_RE.exec($candidate))) {
			type = Suggestion.MENTION;
		} else if ((match = EMOJI_AUTOCOMPLETE_RE.exec($candidate))) {
			type = Suggestion.EMOJI;
		} else {
			return;
		}

		const start = match.index!;
		const length = match[0].length;

		const matched = match[1].toLowerCase();

		const rangeStart = findNodePosition(renderer!, start);
		const rangeEnd = findNodePosition(renderer!, start + length);

		let range: Range | undefined;
		if (rangeStart && rangeEnd) {
			range = new Range();
			range.setStart(rangeStart.node, rangeStart.position);
			range.setEnd(rangeEnd.node, rangeEnd.position);
		}

		return {
			type: type,
			range: range,
			index: start,
			length: length,
			query: type === Suggestion.MENTION ? matched.replace(TRIM_MENTION_RE, '') : matched,
		};
	});

	const debouncedMatchedCompletion = useDebouncedValue(
		matchedCompletion,
		500,
		(a, b) => a?.query === b?.query && a?.type === b?.type,
	);

	const [suggestions] = createResource(
		debouncedMatchedCompletion,
		async (match): Promise<SuggestionItem[]> => {
			const type = match.type;
			const query = match.query;

			const MATCH_LIMIT = 5;

			if (type === Suggestion.EMOJI) {
				if (!emojiPromise) {
					emojiPromise = fetch(emojiListJson)
						.then((response) => {
							if (!response.ok) {
								throw new Error(`Response error ${response.status}`);
							}

							return response.json();
						})
						.catch((err) => {
							emojiPromise = undefined;
							return Promise.reject(err);
						});
				}

				const emojis = await emojiPromise;
				const items: EmojiSuggestionItem[] = [];

				let count = 0;

				for (let idx = 0, len = emojis.length; idx < len; idx++) {
					const [name, emoji] = emojis[idx];

					if (name.startsWith(query)) {
						items.push({ type: Suggestion.EMOJI, name, emoji });

						++count;
						// if (++count >= MATCH_LIMIT) {
						// 	break;
						// }
					} else if (count > 0) {
						break;
					}
				}

				return items;
			} else if (type === Suggestion.MENTION) {
				const $uid = props.uid;
				const agent = await multiagent.connect($uid);

				const response = await agent.rpc.get('app.bsky.actor.searchActorsTypeahead', {
					params: {
						q: match.query,
						limit: MATCH_LIMIT,
					},
				});

				return response.data.actors.map((item) => ({ type: Suggestion.MENTION, data: item }));
			}

			assert(false, `expected match`);
		},
	);

	const [floating, setFloating] = createSignal<HTMLElement>();
	const position = useFloating(() => matchedCompletion()?.range, floating, {
		placement: 'bottom-start',
		middleware: [autoPlacement({ allowedPlacements: ['top', 'bottom'] }), offset({ mainAxis: 4 })],
		whileElementsMounted: autoUpdate,
	});

	const acceptSuggestion = (item: SuggestionItem) => {
		const $match = matchedCompletion();
		const type = item.type;

		if (!$match) {
			return;
		}

		let text: string;
		if (type === Suggestion.EMOJI) {
			text = item.emoji + ' ';
		} else if (type === Suggestion.MENTION) {
			text = `@${item.data.handle} `;
		} else {
			assert(false, `expected type`);
		}

		const $value = props.value;

		const pre = $value.slice(0, $match.index);
		const post = $value.slice($match.index + $match.length);

		const final = pre + text + post;
		const cursor = $match.index + text.length;

		props.onChange(final);

		textarea!.setSelectionRange(cursor, cursor);
		textarea!.focus();

		handleInputSelection();
	};

	const handleInputSelection = () => {
		const start = textarea!.selectionStart;
		const end = textarea!.selectionEnd;

		setInputCursor(start === end ? start : undefined);
	};

	makeEventListener(document, 'selectionchange', () => {
		if (document.activeElement !== textarea) {
			return;
		}

		handleInputSelection();
	});

	onMount(() => {
		textarea!.focus();
	});

	return (
		<div class="relative">
			<div ref={renderer} class="absolute inset-0 z-0 whitespace-pre-wrap break-words pb-4 pr-3 pt-5 text-xl">
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
				class="relative z-10 block w-full resize-none overflow-hidden bg-transparent pb-4 pr-3 pt-5 text-xl text-transparent caret-primary outline-none"
				onPaste={(ev) => {
					const items = ev.clipboardData?.items ?? [];
					let images: File[] = [];

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

						let images: File[] = [];
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
				}}
				onKeyDown={(ev) => {
					const key = ev.key;

					if (key === 'Backspace') {
						setTimeout(handleInputSelection, 0);
					}

					if (matchedCompletion()) {
						const $sel = menuSelection();
						const $suggestions = !suggestions.error && suggestions();

						if (key === 'Escape') {
							setInputCursor(undefined);
						} else if ($suggestions) {
							if (key === 'ArrowUp') {
								ev.preventDefault();

								if ($suggestions.length > 0) {
									setMenuSelection($sel == null || $sel <= 0 ? $suggestions.length - 1 : $sel - 1);
								} else {
									setMenuSelection(undefined);
								}
							} else if (key === 'ArrowDown') {
								ev.preventDefault();

								if ($suggestions.length > 0) {
									setMenuSelection(($sel == null || $sel >= $suggestions.length - 1 ? -1 : $sel) + 1);
								} else {
									setMenuSelection(undefined);
								}
							} else if ($sel != null && key === 'Enter') {
								const item = $suggestions[$sel];

								ev.preventDefault();
								if (item) {
									acceptSuggestion(item);
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

			<Show when={matchedCompletion()}>
				{(matchedCompletion) => (
					<ul
						ref={setFloating}
						class="absolute z-40 max-h-72 w-full overflow-auto rounded-md border border-divider bg-background shadow-lg sm:w-max"
						style={{
							'max-width': 'calc(100% - 12px)',
							'min-width': `180px`,
							top: `${position.y ?? 0}px`,
							// left: `${position.x ?? 0}px`,
						}}
					>
						<Switch>
							<Match when={suggestions.loading || (matchedCompletion() && !debouncedMatchedCompletion())}>
								<div class="flex h-14 w-full items-center justify-center">
									<CircularProgress />
								</div>
							</Match>

							<Match when={!suggestions.error && suggestions()}>
								{(suggestions) => (
									<For
										each={suggestions()}
										fallback={
											<div class="px-4 py-2">
												<span class="text-sm text-muted-fg">
													No {renderSuggestionLabel(matchedCompletion().type)} found matching this query
												</span>
											</div>
										}
									>
										{(item, index) => {
											const selected = () => menuSelection() === index();
											const type = item.type;

											let node: JSX.Element;
											if (type === Suggestion.EMOJI) {
												const name = item.name;
												const emoji = item.emoji;

												node = (
													<div class="contents">
														<span class="text-base">{emoji}</span>
														<span class="text-sm">{name}</span>
													</div>
												);
											} else if (type === Suggestion.MENTION) {
												const user = item.data;

												node = (
													<div class="contents">
														<div class="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted-fg">
															<Show when={user.avatar} keyed>
																{(avatar) => <img src={avatar} class="h-full w-full" />}
															</Show>
														</div>

														<div class="flex grow flex-col text-sm">
															<span class="line-clamp-1 break-all font-bold">
																{user.displayName || user.handle}
															</span>
															<span class="line-clamp-1 shrink-0 break-all text-muted-fg">
																@{user.handle}
															</span>
														</div>
													</div>
												);
											} else {
												assert(false, `expected type`);
											}

											return (
												<li
													ref={(node) => {
														createEffect(() => {
															if (selected()) {
																node.scrollIntoView({ block: 'center' });
															}
														});
													}}
													role="option"
													tabIndex={-1}
													aria-selected={selected()}
													onClick={() => {
														acceptSuggestion(item);
													}}
													// onMouseEnter={() => {
													// 	setMenuSelection(index());
													// }}
													class="flex cursor-pointer items-center gap-4 px-4 py-2 hover:bg-hinted"
													classList={{ 'bg-hinted': selected() }}
												>
													{node}
												</li>
											);
										}}
									</For>
								)}
							</Match>
						</Switch>
					</ul>
				)}
			</Show>
		</div>
	);
};

export default RichtextComposer;

const renderSuggestionLabel = (suggestion: Suggestion) => {
	if (suggestion === Suggestion.EMOJI) {
		return `emojis`;
	} else if (suggestion === Suggestion.MENTION) {
		return `users`;
	}

	return `N/A`;
};

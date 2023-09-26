import { For, Show, createMemo, createRenderEffect, createResource, createSignal } from 'solid-js';

import type { DID, RefOf } from '@intrnl/bluesky-client/atp-schema';

import { type ReferenceElement, flip, size, autoUpdate } from '@floating-ui/dom';
import { useFloating } from 'solid-floating-ui';

import { $createTextNode, TextNode } from 'lexical';

import { useLexicalComposerContext } from 'lexical-solid/LexicalComposerContext';
import { type QueryMatch, LexicalTypeaheadMenuPlugin, MenuOption } from 'lexical-solid/LexicalTypeaheadMenuPlugin';

import { multiagent } from '~/globals/agent.ts';
import { useDebouncedValue } from '~/utils/hooks.ts';

import { $createMentionNode } from './MentionNode.ts';

const MENTION_SUGGESTIONS_LIMIT = 6;

const MENTION_RE = /(^|\s|\()(@[a-zA-Z0-9.-]+)$/;
const MIN_MATCH_LENGTH = 1;

const getPossibleQueryMatch = (text: string): QueryMatch | null => {
	const match = MENTION_RE.exec(text);

	if (match !== null) {
		// The strategy ignores leading whitespace but we need to know it's
		// length to add it to the leadOffset
		const maybeLeadingWhitespace = match[1];
		const matchingString = match[2];

		if (matchingString != null && matchingString.length >= MIN_MATCH_LENGTH) {
			return {
				leadOffset: match.index + maybeLeadingWhitespace.length,
				matchingString,
				replaceableString: matchingString,
			};
		}
	}

	return null;
};

class MentionTypeaheadOption extends MenuOption {
	constructor(public data: RefOf<'app.bsky.actor.defs#profileViewBasic'>) {
		super(data.did);
	}
}

export interface MentionsPluginProps {
	uid: DID;
}

const MentionsPlugin = (props: MentionsPluginProps) => {
	const [editor] = useLexicalComposerContext();

	const [reference, setReference] = createSignal<ReferenceElement>();
	const [floating, setFloating] = createSignal<HTMLElement>();

	const [query, setQuery] = createSignal('');
	const debouncedQuery = useDebouncedValue(query, 500);

	// not certain about using sq for this since this data never really sticks
	// around for use outside of the composer
	const [results] = createResource(
		() => {
			const $debouncedQuery = debouncedQuery();
			return $debouncedQuery ? ([props.uid, $debouncedQuery] as const) : false;
		},
		async ([$uid, $query]) => {
			const agent = await multiagent.connect($uid);

			const response = await agent.rpc.get('app.bsky.actor.searchActorsTypeahead', {
				params: {
					term: $query,
					limit: MENTION_SUGGESTIONS_LIMIT,
				},
			});

			return response.data.actors;
		},
	);

	const options = createMemo(() => {
		const $results = results();

		if ($results) {
			return $results.map((item) => new MentionTypeaheadOption(item));
		}

		return [];
	});

	const position = useFloating(reference, floating, {
		whileElementsMounted: autoUpdate,
		strategy: 'absolute',
		placement: 'bottom-start',
		middleware: [
			flip(),
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
	});

	const onSelectOption = (
		option: MentionTypeaheadOption,
		replaceNode: TextNode | null,
		closeMenu: () => void,
	) => {
		editor.update(() => {
			const data = option.data;
			const node = $createMentionNode(data.did, '@' + data.handle);

			if (replaceNode) {
				replaceNode.replace(node);
			}

			if (node.canInsertTextAfter()) {
				const ws = $createTextNode(' ');

				node.insertAfter(ws);
				ws.select();
			} else {
				node.select();
			}

			closeMenu();
		});
	};

	return (
		<LexicalTypeaheadMenuPlugin<MentionTypeaheadOption>
			onQueryChange={setQuery}
			onSelectOption={onSelectOption}
			triggerFn={getPossibleQueryMatch}
			options={options()}
			onOpen={(res) => {
				setReference({ getBoundingClientRect: res.getRect });
			}}
			menuRenderFn={(anchor, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => (
				<Show when={options().length > 0 && anchor.current}>
					{($anchor) => {
						createRenderEffect(() => setReference($anchor));

						return (
							<div
								ref={setFloating}
								class="z-40 overflow-hidden rounded-md border border-divider bg-background shadow-lg"
								style={{
									'min-width': `180px`,
									width: 'max-content',
									position: position.strategy,
									top: `${position.y ?? 0}px`,
									left: `${position.x ?? 0}px`,
								}}
							>
								<ul style={{ opacity: query() !== debouncedQuery() || results.loading ? 0.65 : 1 }}>
									<For each={options()}>
										{(option, index) => {
											const selected = () => selectedIndex() === index();
											const item = option.data;

											return (
												<li
													ref={option.setRefElement}
													role="option"
													tabIndex={-1}
													aria-selected={selected()}
													onClick={() => {
														setHighlightedIndex(index());
														selectOptionAndCleanUp(option);
													}}
													onMouseEnter={() => {
														setHighlightedIndex(index());
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
								</ul>
							</div>
						);
					}}
				</Show>
			)}
		/>
	);
};

export default MentionsPlugin;

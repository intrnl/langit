import { For, Show, createMemo, createRenderEffect, createSignal } from 'solid-js';

import { type ReferenceElement, flip, size, autoUpdate } from '@floating-ui/dom';
import { useFloating } from 'solid-floating-ui';

import { $createTextNode, TextNode } from 'lexical';

import { useLexicalComposerContext } from 'lexical-solid/LexicalComposerContext';
import {
	type QueryMatch,
	LexicalTypeaheadMenuPlugin,
	MenuOption,
} from 'lexical-solid/LexicalTypeaheadMenuPlugin';

import { $createHashtagNode } from './HashtagNode.ts';

const HASHTAG_RE = /(^|\s|\()(#[\S]+)$/u;

const getPossibleQueryMatch = (text: string): QueryMatch | null => {
	const match = HASHTAG_RE.exec(text);

	if (match !== null) {
		// The strategy ignores leading whitespace but we need to know it's
		// length to add it to the leadOffset
		const maybeLeadingWhitespace = match[1];
		const matchingString = match[2];

		return {
			leadOffset: match.index + maybeLeadingWhitespace.length,
			matchingString,
			replaceableString: matchingString,
		};
	}

	return null;
};

class HashtagTypeaheadOption extends MenuOption {
	constructor(public data: string) {
		super(data);
	}
}

export interface HashtagsPluginProps {}

const HashtagsPlugin = () => {
	const [editor] = useLexicalComposerContext();

	const [reference, setReference] = createSignal<ReferenceElement>();
	const [floating, setFloating] = createSignal<HTMLElement>();

	const [query, setQuery] = createSignal('');

	const options = createMemo(() => {
		return [new HashtagTypeaheadOption(query())];
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
		option: HashtagTypeaheadOption,
		replaceNode: TextNode | null,
		closeMenu: () => void,
	) => {
		editor.update(() => {
			const data = option.data;
			const node = $createHashtagNode(data);

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
		<LexicalTypeaheadMenuPlugin<HashtagTypeaheadOption>
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
								<ul>
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
													{item}
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

export default HashtagsPlugin;

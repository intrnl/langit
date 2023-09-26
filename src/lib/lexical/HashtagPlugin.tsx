import { onMount } from 'solid-js';

import { useLexicalComposerContext } from 'lexical-solid/LexicalComposerContext';
import { useLexicalTextEntity } from 'lexical-solid/useLexicalTextEntity';

import type { TextNode } from 'lexical';
import { $createHashtagNode, HashtagNode } from '@lexical/hashtag';

const HASHTAG_RE = /(?:^|\s)(#[^\d\s#][^\s#]*)(?=\s)?/;
const LEADING_WHITESPACE_RE = /^\s/;
const PUNCTUATION_RE = /\p{P}+$/gu;

const HashtagPlugin = () => {
	const [editor] = useLexicalComposerContext();

	if (import.meta.env.DEV) {
		onMount(() => {
			if (!editor.hasNodes([HashtagNode])) {
				throw new Error('HashtagPlugin: HashtagNode not registered on editor');
			}
		});
	}

	const createHashtagNode = (node: TextNode) => {
		return $createHashtagNode(node.getTextContent());
	};

	const getHashtagMatch = (text: string) => {
		const match = HASHTAG_RE.exec(text);

		if (!match) {
			return null;
		}

		const raw = match[0];
		const ws = LEADING_WHITESPACE_RE.test(raw);

		const hashtag = raw.trimEnd().replace(PUNCTUATION_RE, '');

		if (hashtag.length > 65) {
			return null;
		}

		const index = match.index + (ws ? 1 : 0);

		return {
			start: index,
			end: index + hashtag.length,
		};
	};

	useLexicalTextEntity(getHashtagMatch, HashtagNode, createHashtagNode);

	return null;
};

export default HashtagPlugin;

import {
	type EditorState,
	type LexicalNode,
	type ParagraphNode,
	type RootNode,
	type TextNode,
	$getRoot,
} from 'lexical';

import { type AutoLinkNode } from '@lexical/link';

import { graphemeLen } from '~/api/richtext/intl.ts';
import { type Facet, type FacetLink } from '~/api/richtext/types.ts';

import { type MentionNode } from './MentionNode.ts';

const encoder = new TextEncoder();

const isAscii = (str: string) => {
	for (let idx = 0, len = str.length; idx < len; idx++) {
		const char = str.charCodeAt(idx);

		if (char > 127) {
			return false;
		}
	}

	return true;
};

export const lexical2rt = (state: EditorState) => {
	const facets: Facet[] = [];
	const links: string[] = [];

	let text = '';
	let length = 0;

	let leading = true;
	let ascii = true;

	const delve = (node: LexicalNode /* , end: boolean */) => {
		const $type = node.getType();

		if ($type === 'root' || $type === 'paragraph') {
			const $node = node as RootNode | ParagraphNode;
			const children = $node.getChildren();

			for (let idx = 0, len = children.length; idx < len; idx++) {
				const child = children[idx];
				delve(child /* , idx === len - 1 */);
			}

			// if (!end && !leading && $type === 'paragraph') {
			// 	text += '\n';
			// 	length += 1;
			// }
		} else if ($type === 'linebreak') {
			if (!leading) {
				text += '\n';
				length += 1;
			}
		} else if ($type === 'text') {
			const $node = node as TextNode;

			let content = $node.getTextContent();

			if (leading) {
				content = content.trimStart();

				if (content.length === 0) {
					return;
				}

				leading = false;
			}

			text += content;

			if (isAscii(content)) {
				length += content.length;
			} else {
				length += encoder.encode(content).byteLength;
				ascii = false;
			}
		} else if ($type === 'mention') {
			const $node = node as MentionNode;

			const handle = $node.getTextContent();
			const did = $node.__did;

			const start = length;

			text += handle;
			length += handle.length;

			leading = false;

			facets.push({
				$type: 'app.bsky.richtext.facet',
				index: {
					byteStart: start,
					byteEnd: length,
				},
				features: [
					{
						$type: 'app.bsky.richtext.facet#mention',
						did: did,
					},
				],
			});
		} else if ($type === 'autolink') {
			const $node = node as AutoLinkNode;

			const content = $node.getTextContent();
			const url = $node.getURL();

			const start = length;
			const feature: FacetLink = {
				$type: 'app.bsky.richtext.facet#link',
				uri: url,
			};

			text += content;

			if (isAscii(content)) {
				length += content.length;
			} else {
				length += encoder.encode(content).byteLength;
				ascii = false;
			}

			leading = false;

			links.push(url);

			facets.push({
				$type: 'app.bsky.richtext.facet',
				index: {
					byteStart: start,
					byteEnd: length,
				},
				features: [feature],
			});
		}
	};

	state.read(() => delve($getRoot() /* , true */));

	const trimmed = text.trimEnd();

	text = trimmed;

	if (ascii) {
		length = trimmed.length;
	}

	return {
		length: ascii ? length : graphemeLen(text),
		text,
		facets: facets.length > 0 ? facets : undefined,
		links: links.length > 0 ? links : undefined,
	};
};

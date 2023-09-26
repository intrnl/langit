import {
	type EditorState,
	type LexicalNode,
	type ParagraphNode,
	type RootNode,
	type TextNode,
	$getRoot,
} from 'lexical';

import type { AutoLinkNode } from '@lexical/link';
import type { HashtagNode } from '@lexical/hashtag';

import type { Facet } from '~/api/richtext/types.ts';
import { graphemeLen } from '~/api/richtext/intl.ts';

import type { MentionNode } from './MentionNode.ts';

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

	const delve = (node: LexicalNode) => {
		const type = node.getType();

		if (type === 'root' || type === 'paragraph') {
			const $node = node as RootNode | ParagraphNode;
			const children = $node.getChildren();

			for (let idx = 0, len = children.length; idx < len; idx++) {
				const child = children[idx];
				delve(child);
			}
		} else if (type === 'linebreak') {
			if (!leading) {
				text += '\n';
				length += 1;
			}
		} else if (type === 'text') {
			const $node = node as TextNode;
			const $parent = $node.getParent<ParagraphNode>();

			let value = $node.getTextContent();
			let end = false;

			if ($parent) {
				const index = $node.getIndexWithinParent();

				const children = $parent.getChildren();
				const length = children.length;

				end = index === length - 1 || (length > 1 && children[index + 1].getType() === 'linebreak');
			}

			if (leading) {
				value = end ? value.trim() : value.trimStart();
				leading = false;
			} else if (end) {
				value = value.trimEnd();
			}

			if (value.length === 0) {
				return;
			}

			text += value;

			if (isAscii(value)) {
				length += value.length;
			} else {
				length += encoder.encode(value).byteLength;
				ascii = false;
			}
		} else if (type === 'mention') {
			const $node = node as MentionNode;

			const handle = $node.getTextContent();
			const did = $node.__did;

			const start = length;

			text += handle;
			length += handle.length;

			leading = false;

			facets.push({
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
		} else if (type === 'hashtag') {
			const $node = node as HashtagNode;

			const content = $node.getTextContent();

			const start = length;

			text += content;

			if (isAscii(content)) {
				length += content.length;
			} else {
				length += encoder.encode(content).byteLength;
				ascii = false;
			}

			leading = false;

			facets.push({
				index: {
					byteStart: start,
					byteEnd: length,
				},
				features: [
					{
						$type: 'app.bsky.richtext.facet#tag',
						tag: content.slice(1),
					},
				],
			});
		} else if (type === 'autolink') {
			const $node = node as AutoLinkNode;

			const content = $node.getTextContent();
			const url = $node.getURL();

			const start = length;

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
				index: {
					byteStart: start,
					byteEnd: length,
				},
				features: [
					{
						$type: 'app.bsky.richtext.facet#link',
						uri: url,
					},
				],
			});
		}
	};

	state.read(() => delve($getRoot()));

	const trimmed = text.trimEnd();
	const trailOffset = text.length - trimmed.length;

	text = trimmed;
	length -= trailOffset;

	return {
		length: ascii ? length : graphemeLen(text),
		text,
		facets: facets.length > 0 ? facets : undefined,
		links: links.length > 0 ? links : undefined,
	};
};

import { type JSONContent } from '@tiptap/core';

import { graphemeLen } from '~/api/richtext/intl.ts';
import { type Facet, type FacetLink } from '~/api/richtext/types.ts';

const encoder = new TextEncoder();

type SerializedMarks = NonNullable<JSONContent['marks']>;

const findFeature = (marks?: SerializedMarks): FacetLink | undefined => {
	if (marks && marks.length) {
		for (let idx = 0, len = marks.length; idx < len; idx++) {
			const mark = marks[idx];

			if (mark.type === 'link') {
				return {
					$type: 'app.bsky.richtext.facet#link',
					uri: mark.attrs!.href,
				};
			}
		}
	}

	return undefined;
};

const isAscii = (str: string) => {
	for (let idx = 0, len = str.length; idx < len; idx++) {
		const char = str.charCodeAt(idx);

		if (char > 127) {
			return false;
		}
	}

	return true;
};

export const pm2rt = (json: JSONContent) => {
	const facets: Facet[] = [];
	const links: string[] = [];

	let text = '';
	let length = 0;

	let leading = true;
	let ascii = true;

	const delve = (node: JSONContent, end: boolean) => {
		const type = node.type;

		if (type === 'doc' || type === 'paragraph') {
			const content = node.content;

			if (content && content.length > 0) {
				for (let idx = 0, len = content.length; idx < len; idx++) {
					const child = content[idx];
					delve(child, idx === len - 1);
				}
			}

			if (!end && !leading && type === 'paragraph') {
				text += '\n';
				length += 1;
			}
		} else if (type === 'text') {
			const feature = findFeature(node.marks);
			const start = length;
			let value = node.text!;

			if (leading) {
				value = value.trimStart();

				if (value.length === 0) {
					return;
				}

				leading = false;
			}

			text += value;

			if (isAscii(value)) {
				length += value.length;
			} else {
				length += encoder.encode(value).byteLength;
				ascii = false;
			}

			if (feature) {
				if (feature.$type === 'app.bsky.richtext.facet#link') {
					links.push(feature.uri);
				}

				facets.push({
					$type: 'app.bsky.richtext.facet',
					index: {
						byteStart: start,
						byteEnd: length,
					},
					features: [feature],
				});
			}
		} else if (type === 'mention') {
			const handle = `@${node.attrs!.label}`;
			const did = node.attrs!.id;

			const start = length;

			length += handle.length;
			text += handle;

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
		}
	};

	delve(json, true);

	const trimmed = text.trimEnd();
	const trailOffset = length - trimmed.length;

	text = trimmed;
	length -= trailOffset;

	return {
		length: ascii ? length : graphemeLen(text),
		text,
		facets: facets.length > 0 ? facets : undefined,
		links: links.length > 0 ? links : undefined,
	};
};

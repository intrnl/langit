import { type JSONContent } from '@tiptap/core';

import { graphemeLen } from '~/api/richtext/intl.ts';
import { type Facet, type FacetLink } from '~/api/richtext/types.ts';

const merge = (a: Uint8Array, b: Uint8Array) => {
	const alen = a.length;
	const blen = b.length;

	const c = new Uint8Array(alen + blen);
	c.set(a, 0);
	c.set(b, alen);

	return c;
};

const encoder = new TextEncoder();

const NEWLINE = new Uint8Array([10]);

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

export const pm2rt = (json: JSONContent) => {
	const facets: Facet[] = [];
	const links: string[] = [];

	let bytes = new Uint8Array(0);
	let text = '';

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

			if (!end && type === 'paragraph') {
				text += '\n';
				bytes = merge(bytes, NEWLINE);
			}
		}
		else if (type === 'text') {
			const value = node.text!;
			const feature = findFeature(node.marks);

			if (feature) {
				const start = bytes.byteLength;

				bytes = merge(bytes, encoder.encode(value));
				text += value;

				if (feature.$type === 'app.bsky.richtext.facet#link') {
					links.push(feature.uri);
				}

				facets.push({
					$type: 'app.bsky.richtext.facet',
					index: {
						byteStart: start,
						byteEnd: bytes.byteLength,
					},
					features: [feature],
				});
			}
			else {
				bytes = merge(bytes, encoder.encode(value));
				text += value;
			}
		}
		else if (type === 'mention') {
			const handle = `@${node.attrs!.label}`;
			const did = node.attrs!.id;

			const start = bytes.byteLength;

			bytes = merge(bytes, encoder.encode(handle));
			text += handle;

			facets.push({
				$type: 'app.bsky.richtext.facet',
				index: {
					byteStart: start,
					byteEnd: bytes.byteLength,
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

	return {
		length: graphemeLen(text),
		text,
		facets: facets.length > 0 ? facets : undefined,
		links: links.length > 0 ? links : undefined,
	};
};

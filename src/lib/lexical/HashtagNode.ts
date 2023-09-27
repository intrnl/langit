import {
	type DOMConversionMap,
	type DOMConversionOutput,
	type DOMExportOutput,
	type EditorConfig,
	type LexicalNode,
	type NodeKey,
	type SerializedTextNode,
	type Spread,
	TextNode,
} from 'lexical';

export type SerializedHashtagNode = Spread<
	{
		type: 'hashtag';
		version: 1;
	},
	SerializedTextNode
>;

const HASHTAG_TAG = 'span';
const HASHTAG_ATTRIBUTE = 'data-hashtag';

const convertHashtagElement = (domNode: HTMLElement): DOMConversionOutput | null => {
	const hashtag = domNode.hasAttribute(HASHTAG_ATTRIBUTE);

	if (hashtag) {
	}

	return null;
};

export class HashtagNode extends TextNode {
	static getType(): string {
		return 'hashtag';
	}

	static clone(node: HashtagNode): HashtagNode {
		return new HashtagNode(node.__text, node.__key);
	}

	static importJSON(serializedNode: SerializedHashtagNode): HashtagNode {
		const node = $createHashtagNode(serializedNode.text);
		node.setFormat(serializedNode.format);
		node.setDetail(serializedNode.detail);
		node.setMode(serializedNode.mode);
		node.setStyle(serializedNode.style);

		return node;
	}

	constructor(text: string, key?: NodeKey) {
		super(text, key);
	}

	exportJSON(): SerializedHashtagNode {
		return {
			...super.exportJSON(),
			type: 'hashtag',
			version: 1,
		};
	}

	createDOM(config: EditorConfig): HTMLElement {
		const dom = super.createDOM(config);
		dom.className = 'lexical-hashtag';
		return dom;
	}

	exportDOM(): DOMExportOutput {
		const element = document.createElement(HASHTAG_TAG);
		element.toggleAttribute(HASHTAG_ATTRIBUTE, true);
		element.textContent = this.__text;
		return { element };
	}

	isSegmented() {
		return false;
	}

	static importDOM(): DOMConversionMap | null {
		return {
			[HASHTAG_TAG]: (domNode: HTMLElement) => {
				if (!domNode.hasAttribute(HASHTAG_ATTRIBUTE)) {
					return null;
				}

				return {
					conversion: convertHashtagElement,
					priority: 1,
				};
			},
		};
	}

	isTextEntity(): true {
		return true;
	}

	isToken(): true {
		return true;
	}
}

export const $createHashtagNode = (text: string): HashtagNode => {
	const hashtagNode = new HashtagNode(text);
	hashtagNode.setMode('segmented').toggleDirectionless();
	return hashtagNode;
};

export const $isHashtagNode = (node: LexicalNode | null | undefined): node is HashtagNode => {
	return node instanceof HashtagNode;
};

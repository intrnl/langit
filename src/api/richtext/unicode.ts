/**
 * Javascript uses utf16-encoded strings while most environments and specs
 * have standardized around utf8 (including JSON).
 *
 * After some lengthy debated we decided that richtext facets need to use
 * utf8 indices. This means we need tools to convert indices between utf8
 * and utf16, and that's precisely what this library handles.
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class UnicodeString {
	utf16: string;
	utf8: Uint8Array;

	constructor(utf16: string) {
		this.utf16 = utf16;
		this.utf8 = encoder.encode(utf16);
	}

	get length() {
		return this.utf8.byteLength;
	}

	slice(start?: number, end?: number): string {
		return decoder.decode(this.utf8.slice(start, end));
	}
}

export const utf16IndexToUtf8Index = (text: UnicodeString, index: number) => {
	return encoder.encode(text.utf16.slice(0, index)).byteLength;
};

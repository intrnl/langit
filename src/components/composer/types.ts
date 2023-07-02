import { type BskyBlob } from '~/api/types.ts';

import { type CompressResult } from '~/utils/image.ts';
import { type Signal } from '~/utils/signals.ts';

export interface PendingImage extends CompressResult {
	name: string;
}

export interface ComposedImage {
	blob: Blob;
	alt: Signal<string>;
	record?: BskyBlob | undefined;
}

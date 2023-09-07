import type { AtBlob } from '@intrnl/bluesky-client/atp-schema';

import type { CompressResult } from '~/utils/image.ts';
import type { Signal } from '~/utils/signals.ts';

export interface PendingImage extends CompressResult {
	name: string;
}

export interface ComposedImage {
	blob: Blob;
	ratio: {
		width: number;
		height: number;
	};
	alt: Signal<string>;
	record?: AtBlob | undefined;
}

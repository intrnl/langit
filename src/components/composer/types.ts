import { type CompressResult } from '~/utils/image.ts';

export interface PendingImage extends CompressResult {
	name: string;
}

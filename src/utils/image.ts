const MAX_HEIGHT = 2_000;
const MAX_WIDTH = 2_000;
const MAX_SIZE = 1_000_000; // 1 MB

export interface ImageResult {
	width: number;
	height: number;
	size: number;
}

export interface CompressResult {
	blob: Blob;
	quality: number;
	after: ImageResult;
	before: ImageResult;
}

export const compress = async (blob: Blob): Promise<CompressResult> => {
	const image = await getImageFromBlob(blob);

	if (blob.size < MAX_SIZE && image.width < MAX_WIDTH && image.height < MAX_HEIGHT) {
		const ref: ImageResult = {
			width: image.width,
			height: image.height,
			size: blob.size,
		};

		return {
			blob: blob,
			quality: 100,
			after: ref,
			before: ref,
		};
	}

	const { width, height } = getResizedResolution(image.width, image.height, MAX_WIDTH, MAX_HEIGHT);

	const canvas = new OffscreenCanvas(width, height);
	const ctx = canvas.getContext('2d');

	if (!ctx) {
		throw new Error(`Failed to compress image, unable to create canvas`);
	}

	ctx.imageSmoothingQuality = 'high';
	ctx.drawImage(image, 0, 0, width, height);

	const large = blob.size > 1_500_000;

	for (let q = large ? 90 : 100; q >= 70; q -= 10) {
		const result = await canvas.convertToBlob({
			type: 'image/webp',
			quality: q / 100,
		});

		if (result.size < MAX_SIZE) {
			return {
				blob: result,
				quality: q,
				after: {
					width,
					height,
					size: result.size,
				},
				before: {
					width: image.width,
					height: image.height,
					size: blob.size,
				},
			};
		}
	}

	throw new Error(`Unable to compress image according to criteria`);
};

export const getImageFromBlob = (blob: Blob): Promise<HTMLImageElement> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		const image = document.createElement('img');

		if (!blob.type.startsWith('image/')) {
			return reject(new Error(`Blob is not an image`));
		}

		image.onload = () => {
			resolve(image);
		};
		image.onerror = () => {
			reject(new Error(`Failed to load image`));
		};

		reader.onload = () => {
			image.src = reader.result as string;
		};
		reader.onerror = () => {
			reject(new Error(`Failed to load image`));
		};

		reader.readAsDataURL(blob);
	});
};

export const getResizedResolution = (w: number, h: number, maxW: number, maxH: number) => {
	if (w > maxW) {
		h = ~~((h * maxW) / w);
		w = maxW;
	}

	if (h > maxH) {
		w = ~~((w * maxH) / h);
		h = maxH;
	}

	return { width: w, height: h };
};

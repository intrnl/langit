import { createStore } from 'solid-js/store';

const [thumbSizeCache, setThumbSizeCache] = createStore<{ [src: string]: { w: number; h: number } }>();

export const onImageLoad = (ev: Event & { currentTarget: HTMLImageElement }) => {
	const img = ev.currentTarget;
	const src = img.src;

	if (!(src in thumbSizeCache)) {
		setThumbSizeCache(src, { w: img.naturalWidth, h: img.naturalHeight });
	}
};

export const getCachedAspectRatio = (src: string) => {
	const dimensions = thumbSizeCache[src];

	if (dimensions) {
		return `${dimensions.w}/${dimensions.h}`;
	}
};

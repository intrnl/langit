import { createMemo, type ComponentProps, onCleanup } from 'solid-js';

export interface BlobImageProps extends Omit<ComponentProps<'img'>, 'src'> {
	src: Blob;
}

interface BlobObject {
	blob: Blob;
	url: string;
	uses: number;
}

const map = new WeakMap<Blob, BlobObject>();

const BlobImage = (props: BlobImageProps) => {
	const blob = createMemo(() => {
		const src = props.src;
		let obj = map.get(src);

		if (!obj) {
			map.set(src, (obj = { blob: src, url: URL.createObjectURL(src), uses: 0 }));
		}

		obj.uses++;

		onCleanup(() => {
			if (--obj!.uses < 1) {
				URL.revokeObjectURL(obj!.url);
				map.delete(src);
			}
		});

		return obj;
	});

	return <img {...props} src={blob().url} />;
};

export default BlobImage;

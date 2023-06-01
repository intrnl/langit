import { type EmbeddedImage } from '~/api/types.ts';

import { createDerivedSignal } from '~/utils/hooks.ts';

export interface ImageViewerDialogProps {
	active?: number;
	images: EmbeddedImage[];
}

const ImageViewerDialog = (props: ImageViewerDialogProps) => {
	const [active, setActive] = createDerivedSignal(() => props.active || 0);

	const image = () => props.images[active()];

	return (
		<>
			<img src={image().fullsize} alt={image().alt} class="max-h-full max-w-full" />
		</>
	);
};

export default ImageViewerDialog;

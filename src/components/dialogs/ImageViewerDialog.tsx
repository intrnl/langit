import { type EmbeddedImage } from '~/api/types.ts';

import { closeModal } from '~/globals/modals.tsx';
import { createDerivedSignal } from '~/utils/hooks.ts';

import CloseIcon from '~/icons/baseline-close.tsx';

export interface ImageViewerDialogProps {
	active?: number;
	images: EmbeddedImage[];
}

const ImageViewerDialog = (props: ImageViewerDialogProps) => {
	const [active, setActive] = createDerivedSignal(() => props.active || 0);

	const image = () => props.images[active()];

	return (
		<>
			<img src={image().fullsize} alt={image().alt} class="z-10 my-auto max-h-full max-w-full" />

			<button
				onClick={() => {
					closeModal();
				}}
				class="fixed left-2.5 top-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black text-base hover:bg-secondary"
			>
				<CloseIcon />
			</button>
		</>
	);
};

export default ImageViewerDialog;

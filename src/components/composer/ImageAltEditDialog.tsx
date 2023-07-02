import { createMemo } from 'solid-js';

import { closeModal } from '~/globals/modals.tsx';
import { createDerivedSignal } from '~/utils/hooks.ts';
import { model } from '~/utils/misc.ts';

import BlobImage from '~/components/BlobImage.tsx';
import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';
import textarea from '~/styles/primitives/textarea.ts';

import { type ComposedImage } from './types.ts';

interface ImageAltEditDialogProps {
	image: ComposedImage;
}

const ImageAltEditDialog = (props: ImageAltEditDialogProps) => {
	const image = () => props.image;

	const [text, setText] = createDerivedSignal(() => image().alt.value);
	const finalText = createMemo(() => text().trim());

	return (
		<div class={/* @once */ dialog.content()}>
			<h1 class={/* @once */ dialog.title()}>Add image description</h1>

			<BlobImage src={image().blob} class="my-4 h-full w-full object-contain" />

			<textarea
				ref={model(text, setText)}
				placeholder="Add description..."
				rows={4}
				class={/* @once */ textarea()}
			/>

			<div class={/* @once */ dialog.actions()}>
				<button onClick={closeModal} class={/* @once */ button({ color: 'ghost' })}>
					Cancel
				</button>
				<button
					onClick={() => {
						closeModal();
						image().alt.value = finalText();
					}}
					class={/* @once */ button({ color: 'primary' })}
				>
					Confirm
				</button>
			</div>
		</div>
	);
};

export default ImageAltEditDialog;

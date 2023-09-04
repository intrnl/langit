import { For } from 'solid-js';

import { closeModal } from '~/globals/modals.tsx';
import { formatSize } from '~/utils/intl/relformatter.ts';

import BlobImage from '~/components/BlobImage.tsx';
import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';

import type { PendingImage } from './types.ts';

interface ImageUploadCompressDialogProps {
	images: PendingImage[];
	onSubmit: () => void;
}

const ImageUploadCompressDialog = (props: ImageUploadCompressDialogProps) => {
	return (
		<div class={/* @once */ dialog.content()}>
			<h1 class={/* @once */ dialog.title()}>Image has been adjusted</h1>

			<p class="mt-3 text-sm">
				The images you tried inserting has been adjusted to fit within the upload limits, would you like to
				proceed?
			</p>

			<div class="mt-6 flex flex-col gap-3">
				<For each={props.images}>
					{(image) => {
						const before = image.before;
						const after = image.after;

						return (
							<div class="flex items-center gap-3">
								<BlobImage
									src={image.blob}
									class="w-20 shrink-0 rounded-md object-contain"
									style={{ 'aspect-ratio': `${after.width}/${after.height}`, 'max-height': '80px' }}
								/>

								<div class="flex min-w-0 flex-col gap-0.5 text-sm">
									<p class="line-clamp-1 break-words font-bold">{image.name}</p>
									<p>
										{before.width}x{before.height} → {after.width}x{after.height}
									</p>
									<p>
										<span>
											{formatSize(before.size)} → {formatSize(after.size)}
										</span>{' '}
										<span class="whitespace-nowrap text-muted-fg">({image.quality}% quality)</span>
									</p>
								</div>
							</div>
						);
					}}
				</For>
			</div>

			<div class={/* @once */ dialog.actions()}>
				<button onClick={closeModal} class={/* @once */ button({ color: 'ghost' })}>
					Cancel
				</button>
				<button
					onClick={() => {
						closeModal();
						props.onSubmit();
					}}
					class={/* @once */ button({ color: 'primary' })}
				>
					Confirm
				</button>
			</div>
		</div>
	);
};

export default ImageUploadCompressDialog;

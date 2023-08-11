import { Match, Switch, lazy } from 'solid-js';

import type { RefOf } from '@intrnl/bluesky-client/atp-schema';

import { openModal } from '~/globals/modals.tsx';

import ImageAltDialog from '~/components/dialogs/ImageAltDialog.tsx';

type EmbeddedImage = RefOf<'app.bsky.embed.images#viewImage'>;

export interface EmbedImageProps {
	images: EmbeddedImage[];
	borderless?: boolean;
	blur?: boolean;
	interactive?: boolean;
}

const LazyImageViewerDialog = lazy(() => import('~/components/dialogs/ImageViewerDialog.tsx'));

const EmbedImage = (props: EmbedImageProps) => {
	const images = () => props.images;

	const interactive = props.interactive;
	const borderless = props.borderless;
	const blur = () => props.blur;

	const render = (index: number, className?: string) => {
		const image = images()[index];
		const alt = image.alt;

		return (
			<div class={'relative overflow-hidden ' + (className || 'min-h-0 grow basis-0')}>
				<img
					src={/* @once */ image.thumb}
					alt={alt}
					onClick={() => {
						if (interactive) {
							openModal(() => <LazyImageViewerDialog images={images()} active={index} />);
						}
					}}
					class="h-full w-full object-cover"
					classList={{
						'cursor-pointer': interactive,
						blur: blur() && !borderless,
						'blur-lg': blur() && borderless,
					}}
				/>

				{interactive && alt && (
					<button
						class="absolute bottom-0 left-0 m-2 h-5 rounded bg-black/70 px-1 text-xs font-medium"
						title="Show image description"
						onClick={() => {
							openModal(() => <ImageAltDialog alt={alt} />);
						}}
					>
						ALT
					</button>
				)}
			</div>
		);
	};

	return (
		<div classList={{ 'overflow-hidden rounded-md border border-divider': !borderless }}>
			<Switch>
				<Match when={images().length >= 4}>
					<div class="flex aspect-video gap-0.5">
						<div class="flex grow basis-0 flex-col gap-0.5">
							{render(0)}
							{render(1)}
						</div>

						<div class="flex grow basis-0 flex-col gap-0.5">
							{render(2)}
							{render(3)}
						</div>
					</div>
				</Match>

				<Match when={images().length >= 3}>
					<div class="flex aspect-video gap-0.5">
						<div class="flex grow basis-0 flex-col gap-0.5">
							{render(0)}
							{render(1)}
						</div>

						<div class="flex grow basis-0 flex-col gap-0.5">{render(2)}</div>
					</div>
				</Match>

				<Match when={images().length >= 2}>
					<div class="flex aspect-video gap-0.5">
						<div class="flex grow basis-0 flex-col gap-0.5">{render(0)}</div>
						<div class="flex grow basis-0 flex-col gap-0.5">{render(1)}</div>
					</div>
				</Match>

				<Match when={images().length === 1}>{render(0, 'aspect-video')}</Match>
			</Switch>
		</div>
	);
};

export default EmbedImage;

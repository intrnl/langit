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

const enum RenderMode {
	MULTIPLE,
	STANDALONE,
	STANDALONE_RATIO,
}

const EmbedImage = (props: EmbedImageProps) => {
	const images = () => props.images;

	const interactive = props.interactive;
	const borderless = props.borderless;
	const blur = () => props.blur;

	const render_ = (index: number, mode: RenderMode) => {
		const image = images()[index];
		const alt = image.alt;

		let cn: string | undefined;
		let ratio: string | undefined;

		if (mode === RenderMode.MULTIPLE) {
			cn = `relative min-h-0 grow basis-0`;
		} else if (mode === RenderMode.STANDALONE) {
			cn = `relative aspect-video`;
		} else if (mode === RenderMode.STANDALONE_RATIO) {
			cn = `min-h-16 min-w-16 relative max-h-80 max-w-full`;
			ratio = `${image.aspectRatio!.width}/${image.aspectRatio!.height}`;
		}

		return (
			<div class={cn} style={{ 'aspect-ratio': ratio }}>
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
						'scale-110': blur(),
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
		<div
			classList={{ 'overflow-hidden rounded-md border border-divider': !borderless }}
			class="max-w-full self-baseline"
		>
			<Switch>
				<Match when={images().length >= 4}>
					<div class="flex aspect-video gap-0.5">
						<div class="flex grow basis-0 flex-col gap-0.5">
							{render_(0, RenderMode.MULTIPLE)}
							{render_(1, RenderMode.MULTIPLE)}
						</div>

						<div class="flex grow basis-0 flex-col gap-0.5">
							{render_(2, RenderMode.MULTIPLE)}
							{render_(3, RenderMode.MULTIPLE)}
						</div>
					</div>
				</Match>

				<Match when={images().length >= 3}>
					<div class="flex aspect-video gap-0.5">
						<div class="flex grow basis-0 flex-col gap-0.5">
							{render_(0, RenderMode.MULTIPLE)}
							{render_(1, RenderMode.MULTIPLE)}
						</div>

						<div class="flex grow basis-0 flex-col gap-0.5">{render_(2, RenderMode.MULTIPLE)}</div>
					</div>
				</Match>

				<Match when={images().length >= 2}>
					<div class="flex aspect-video gap-0.5">
						<div class="flex grow basis-0 flex-col gap-0.5">{render_(0, RenderMode.MULTIPLE)}</div>
						<div class="flex grow basis-0 flex-col gap-0.5">{render_(1, RenderMode.MULTIPLE)}</div>
					</div>
				</Match>

				<Match
					when={(() => {
						const $images = images();
						return interactive && $images.length === 1 && $images[0].aspectRatio;
					})()}
				>
					{render_(0, RenderMode.STANDALONE_RATIO)}
				</Match>

				<Match when={images().length === 1}>{render_(0, RenderMode.STANDALONE)}</Match>
			</Switch>
		</div>
	);
};

export default EmbedImage;

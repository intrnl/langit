import { Match, Suspense, Switch, lazy } from 'solid-js';

import { type EmbeddedImage } from '~/api/types.ts';

import { openModal } from '~/globals/modals.tsx';

import ImageAltDialog from '~/components/dialogs/ImageAltDialog.tsx';
import CircularProgress from '~/components/CircularProgress.tsx';

export interface EmbedImageProps {
	images: EmbeddedImage[];
	borderless?: boolean;
	interactive?: boolean;
}

const LazyImageViewerDialog = lazy(() => import('~/components/dialogs/ImageViewerDialog.tsx'));

const EmbedImage = (props: EmbedImageProps) => {
	const images = () => props.images;
	const interactive = () => props.interactive;

	const render = (index: number, className?: string) => {
		const image = images()[index];
		const alt = image.alt;

		return (
			<div class={'relative ' + (className || 'min-h-0 grow basis-0')}>
				<img
					src={/* @once */ image.thumb}
					alt={alt}
					onClick={() => {
						if (interactive()) {
							openModal(() => (
								<Suspense
									fallback={
										<div class="my-auto">
											<CircularProgress />
										</div>
									}
								>
									<LazyImageViewerDialog images={images()} active={index} />
								</Suspense>
							));
						}
					}}
					class="h-full w-full object-cover"
					classList={{ 'cursor-pointer': interactive() }}
				/>

				{interactive() && alt && (
					<button
						class="absolute bottom-0 left-0 m-2 h-5 rounded bg-black/70 px-1 text-xs font-medium"
						classList={{ 'pointer-events-none': !interactive() }}
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
		<div classList={{ 'overflow-hidden rounded-md border border-divider': !props.borderless }}>
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

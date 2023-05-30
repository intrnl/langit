import { Match, Switch } from 'solid-js';

import { type EmbeddedImage } from '~/api/types.ts';

export interface EmbedImageProps {
	images: EmbeddedImage[];
	borderless?: boolean;
}

const renderImg = (image: EmbeddedImage, className?: string) => {
	return <img src={image.thumb} alt={image.alt} class={className} />;
};

const EmbedImage = (props: EmbedImageProps) => {
	const images = () => props.images;

	return (
		<div classList={{ 'overflow-hidden rounded-md border border-divider': !props.borderless }}>
			<Switch>
				<Match when={images().length >= 4}>
					<div class="flex aspect-video gap-0.5">
						<div class="flex grow basis-0 flex-col gap-0.5">
							{renderImg(images()[0], 'min-h-0 grow basis-0 object-cover')}
							{renderImg(images()[1], 'min-h-0 grow basis-0 object-cover')}
						</div>

						<div class="flex grow basis-0 flex-col gap-0.5">
							{renderImg(images()[2], 'min-h-0 grow basis-0 object-cover')}
							{renderImg(images()[3], 'min-h-0 grow basis-0 object-cover')}
						</div>
					</div>
				</Match>

				<Match when={images().length >= 3}>
					<div class="flex aspect-video gap-0.5">
						<div class="flex grow basis-0 flex-col gap-0.5">
							{renderImg(images()[0], 'min-h-0 grow basis-0 object-cover')}
							{renderImg(images()[1], 'min-h-0 grow basis-0 object-cover')}
						</div>

						<div class="flex grow basis-0 flex-col gap-0.5">
							{renderImg(images()[2], 'min-h-0 grow basis-0 object-cover')}
						</div>
					</div>
				</Match>

				<Match when={images().length >= 2}>
					<div class="flex aspect-video gap-0.5">
						<div class="flex grow basis-0 flex-col gap-0.5">
							{renderImg(images()[0], 'min-h-0 grow basis-0 object-cover')}
						</div>
						<div class="flex grow basis-0 flex-col gap-0.5">
							{renderImg(images()[1], 'min-h-0 grow basis-0 object-cover')}
						</div>
					</div>
				</Match>

				<Match when={images().length === 1}>
					{renderImg(images()[0], 'aspect-video w-full object-cover')}
				</Match>
			</Switch>
		</div>
	);
};

export default EmbedImage;

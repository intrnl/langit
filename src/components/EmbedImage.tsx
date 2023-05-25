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
		<div class={!props.borderless ? ' overflow-hidden rounded-md border border-divider' : ''}>
			<Switch>
				<Match when={images().length >= 4}>
					<div class="grid max-h-50vh grid-cols-2 grid-rows-2 gap-0.5">
						{renderImg(images()[0], 'h-full w-full object-cover')}
						{renderImg(images()[1], 'h-full w-full object-cover')}
						{renderImg(images()[2], 'h-full w-full object-cover')}
						{renderImg(images()[3], 'h-full w-full object-cover')}
					</div>
				</Match>

				<Match when={images().length >= 3}>
					<div class="grid max-h-50vh grid-flow-col grid-rows-2 gap-0.5">
						{renderImg(images()[0], 'h-full w-full object-cover')}
						{renderImg(images()[1], 'h-full w-full object-cover')}
						{renderImg(images()[2], 'h-full w-full row-span-2 object-cover')}
					</div>
				</Match>

				<Match when={images().length >= 2}>
					<div class="grid max-h-50vh grid-cols-2 gap-0.5">
						{renderImg(images()[0], 'h-full object-cover')}
						{renderImg(images()[1], 'h-full object-cover')}
					</div>
				</Match>

				<Match when={images().length === 1}>{renderImg(images()[0], 'max-h-50vh w-full object-cover')}</Match>
			</Switch>
		</div>
	);
};

export default EmbedImage;

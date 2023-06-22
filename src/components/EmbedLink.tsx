import { Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { type EmbeddedLink } from '~/api/types.ts';

import BlobImage from '~/components/BlobImage.tsx';

export interface EmbedLinkData extends Omit<EmbeddedLink, 'thumb'> {
	thumb?: string | Blob;
}

export interface EmbedLinkProps {
	link: EmbedLinkData;
	interactive?: boolean;
}

const getDomain = (url: string) => {
	const host = new URL(url).host;
	return host.startsWith('www.') ? host.slice(4) : host;
};

const EmbedLink = (props: EmbedLinkProps) => {
	const link = () => props.link;
	const interactive = () => props.interactive;

	return (
		<Dynamic
			component={interactive() ? 'a' : 'div'}
			href={link().uri}
			rel="noopener noreferrer nofollow"
			target="_blank"
			class="flex overflow-hidden rounded-md border border-divider"
			classList={{ 'hover:bg-secondary': interactive() }}
		>
			<Show when={link().thumb} keyed>
				{(thumb) => {
					if (thumb instanceof Blob) {
						return (
							<BlobImage
								src={thumb}
								class="aspect-square w-[86px] border-r border-divider object-cover sm:w-32"
							/>
						);
					}

					return (
						<img src={thumb} class="aspect-square w-[86px] border-r border-divider object-cover sm:w-32" />
					);
				}}
			</Show>

			<div class="flex flex-col justify-center gap-0.5 p-3 text-sm">
				<p class="text-muted-fg">{getDomain(link().uri)}</p>
				<p class="line-clamp-2 empty:hidden">{link().title}</p>

				<div class="hidden sm:block">
					<p class="line-clamp-2 text-muted-fg empty:hidden">{link().description}</p>
				</div>
			</div>
		</Dynamic>
	);
};

export default EmbedLink;

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
			class="overflow-hidden rounded-md border border-divider"
			classList={{ 'hover:bg-secondary': interactive() }}
		>
			<Show when={link().thumb} keyed>
				{(thumb) => {
					if (thumb instanceof Blob) {
						return (
							<BlobImage
								src={thumb}
								class="aspect-video w-full border-b border-divider bg-muted-fg object-cover"
							/>
						);
					}

					return (
						<img src={thumb} class="aspect-video w-full border-b border-divider bg-muted-fg object-cover" />
					);
				}}
			</Show>

			<div class="flex flex-col gap-0.5 p-3 text-sm">
				<p class="text-muted-fg">{getDomain(link().uri)}</p>
				<p class="line-clamp-2 overflow-hidden empty:hidden">{link().title}</p>
				<p class="line-clamp-2 overflow-hidden text-muted-fg empty:hidden">{link().description}</p>
			</div>
		</Dynamic>
	);
};

export default EmbedLink;

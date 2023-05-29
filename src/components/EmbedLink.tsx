import { Show } from 'solid-js';

import { type EmbeddedLink } from '~/api/types.ts';

import { getCachedAspectRatio, onImageLoad } from '~/utils/image-cache.ts';

export interface EmbedLinkProps {
	link: EmbeddedLink;
}

const getDomain = (url: string) => {
	const host = new URL(url).host;
	return host.startsWith('www.') ? host.slice(4) : host;
};

const EmbedLink = (props: EmbedLinkProps) => {
	const link = () => props.link;

	return (
		<a
			href={link().uri}
			rel="noopener noreferrer nofollow"
			target="_blank"
			class="overflow-hidden rounded-md border border-divider hover:bg-secondary"
		>
			<Show when={link().thumb}>
				{(thumb) => (
					<img
						src={thumb()}
						class="max-h-50vh w-full border-b border-divider bg-muted-fg object-cover"
						style={{ 'aspect-ratio': getCachedAspectRatio(thumb()) }}
						onLoad={onImageLoad}
					/>
				)}
			</Show>

			<div class="flex flex-col gap-0.5 p-3 text-sm">
				<p class="text-muted-fg">{getDomain(link().uri)}</p>
				<p class="line-clamp-2 overflow-hidden empty:hidden">{link().title}</p>
				<p class="line-clamp-2 overflow-hidden text-muted-fg empty:hidden">{link().description}</p>
			</div>
		</a>
	);
};

export default EmbedLink;

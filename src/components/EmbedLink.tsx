import { Show } from 'solid-js';

import { type EmbeddedLink } from '~/api/types.ts';

export interface EmbedLinkProps {
	link: EmbeddedLink;
}

const EmbedLink = (props: EmbedLinkProps) => {
	const link = () => props.link;

	return (
		<div class='rounded-md border border-divider overflow-hidden'>
			<Show when={link().thumb}>
				{(thumb) => <img src={thumb()} class='w-full max-h-141 bg-muted-fg border-b border-divider' />}
			</Show>

			<div class='flex flex-col gap-0.5 p-3 text-sm'>
				<p class='text-muted-fg'>{new URL(link().uri).host}</p>
				<p>{link().title}</p>
				<p class='text-muted-fg'>{link().description}</p>
			</div>
		</div>
	);
};

export default EmbedLink;

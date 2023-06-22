import { type ComponentProps } from 'solid-js';

const PlaylistAddIcon = (props: ComponentProps<'svg'>) => {
	return (
		<svg width="1em" height="1em" viewBox="0 0 24 24" {...props}>
			<path
				fill="currentColor"
				d="M14 10H3v2h11v-2zm0-4H3v2h11V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM3 16h7v-2H3v2z"
			/>
		</svg>
	);
};

export default PlaylistAddIcon;

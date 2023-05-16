import { type ComponentProps } from 'solid-js';

const HomeIcon = (props: ComponentProps<'svg'>) => {
	return (
		<svg width='1em' height='1em' viewBox='0 0 24 24' {...props}>
			<path fill='currentColor' d='M10 20v-6h4v6h5v-8h3L12 3L2 12h3v8z' />
		</svg>
	);
};

export default HomeIcon;

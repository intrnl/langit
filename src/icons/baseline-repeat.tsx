import { type ComponentProps } from 'solid-js';

const RepeatIcon = (props: ComponentProps<'svg'>) => {
	return (
		<svg width='1em' height='1em' viewBox='0 0 24 24' {...props}>
			<path fill='currentColor' d='M7 7h10v3l4-4l-4-4v3H5v6h2V7zm10 10H7v-3l-4 4l4 4v-3h12v-6h-2v4z' />
		</svg>
	);
};

export default RepeatIcon;

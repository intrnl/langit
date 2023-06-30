import { type ComponentProps } from 'solid-js';

const ArrowDropDownIcon = (props: ComponentProps<'svg'>) => {
	return (
		<svg {...props} width="1em" height="1em" viewBox="0 0 24 24">
			<path fill="currentColor" d="m7 10l5 5l5-5z" />
		</svg>
	);
};

export default ArrowDropDownIcon;

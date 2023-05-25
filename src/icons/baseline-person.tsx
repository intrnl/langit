import { type ComponentProps } from 'solid-js';

const PersonIcon = (props: ComponentProps<'svg'>) => {
	return (
		<svg width='1em' height='1em' viewBox='0 0 24 24' {...props}>
			<path
				fill='currentColor'
				d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'
			/>
		</svg>
	);
};

export default PersonIcon;

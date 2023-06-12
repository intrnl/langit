import { type ComponentProps } from 'solid-js';

const DragHandleIcon = (props: ComponentProps<'svg'>) => {
	return (
		<svg width="1em" height="1em" viewBox="0 0 24 24" {...props}>
			<path fill="currentColor" d="M20 9H4v2h16V9zM4 15h16v-2H4v2z" />
		</svg>
	);
};

export default DragHandleIcon;

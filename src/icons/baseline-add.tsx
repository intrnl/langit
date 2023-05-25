import { type ComponentProps } from 'solid-js';

const AddIcon = (props: ComponentProps<'svg'>) => {
	return (
		<svg width="1em" height="1em" viewBox="0 0 24 24" {...props}>
			<path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
		</svg>
	);
};

export default AddIcon;

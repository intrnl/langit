interface ButtonProps {
	class?: string;
	size?: 'xs' | 'sm';
	color?: 'primary' | 'danger' | 'secondary' | 'outline' | 'ghost';
}

const button = (props: ButtonProps = {}) => {
	const { class: className, size = 'sm', color = 'secondary' } = props;

	let cn = `inline-flex items-center rounded-md text-sm font-medium outline-2 outline-primary focus-visible:outline disabled:pointer-events-none disabled:opacity-50`;

	if (size === 'xs') {
		cn += ` h-8 px-4 leading-none`;
	} else if (size === 'sm') {
		cn += ` h-9 px-4`;
	}

	if (color === 'primary') {
		cn += ` bg-primary text-primary-fg hover:bg-primary/90 outline-offset-2`;
	} else if (color === 'danger') {
		cn += ` bg-red-600 text-primary hover:bg-red-700 outline-offset-2`;
	} else if (color === 'secondary') {
		cn += ` bg-secondary text-secondary-fg hover:bg-secondary/80`;
	} else if (color === 'outline') {
		cn += ` border border-input hover:bg-hinted hover:text-hinted-fg`;
	} else if (color === 'ghost') {
		cn += ` hover:bg-hinted hover:text-hinted-fg`;
	}

	if (className) {
		return `${cn} ${className}`;
	} else {
		return cn;
	}
};

export default button;

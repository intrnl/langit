import { cva } from 'class-variance-authority';

const button = cva(
	`inline-flex items-center rounded-md font-medium text-sm focus-visible:outline focus-visible:outline-2 disabled:opacity-50 disabled:pointer-events-none`,
	{
		variants: {
			size: {
				sm: `h-9 px-4`,
			},
			color: {
				primary:
					`bg-primary text-primary-fg hover:bg-primary/90 focus-visible:outline-offset-2 focus-visible:outline-primary`,
				secondary: `bg-secondary text-secondary-fg hover:bg-secondary/80`,
				outline: `border border-input hover:bg-hinted hover:text-hinted-fg`,
				ghost: `hover:bg-hinted hover:text-hinted-fg`,
			},
		},

		defaultVariants: {
			size: 'sm',
			color: 'secondary',
		},
	},
);

export default button;

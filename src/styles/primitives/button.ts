import { cva } from 'class-variance-authority';

const button = cva(
	`inline-flex items-center rounded-md text-sm font-medium outline-2 focus-visible:outline disabled:pointer-events-none disabled:opacity-50`,
	{
		variants: {
			size: {
				xs: 'h-8 px-4 leading-none',
				sm: `h-9 px-4`,
			},
			color: {
				primary: `bg-primary text-primary-fg hover:bg-primary/90 outline-offset-2 outline-primary`,
				danger: `bg-red-600 text-primary hover:bg-red-700 outline-offset-2 outline-primary`,
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

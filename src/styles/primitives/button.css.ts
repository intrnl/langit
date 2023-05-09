import { cva } from 'class-variance-authority';

const button = cva(
	`rounded-md font-medium focus-visible:outline focus-visible:outline-2`,
	{
		variants: {
			size: {
				xs: `px-2 py-1 text-xs`,
				sm: `px-2 py-1 text-sm`,
				md: `px-2.5 py-1.5 text-sm`,
				lg: `px-3 py-2 text-sm`,
			},
			color: {
				primary:
					`bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-300`,
				secondary:
					`bg-white text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-600`,
			},
		},

		defaultVariants: {
			size: 'md',
			color: 'secondary',
		},
	},
);

export default button;

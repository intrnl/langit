import forms from '@tailwindcss/forms';
import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{ts,tsx}'],
	theme: {
		extend: {
			spacing: {
				13: '3.25rem',
				17: '4.24rem',
			},
			maxHeight: {
				141: '35.25rem',
			},
			flexGrow: {
				4: '4',
			},
			aspectRatio: {
				banner: '3 / 1',
			},
		},
		colors: {
			accent: 'rgb(var(--accent))',
			background: 'rgb(var(--background))',
			primary: {
				DEFAULT: 'rgb(var(--primary))',
				fg: 'rgb(var(--primary-fg))',
			},
			secondary: {
				DEFAULT: 'rgb(var(--secondary))',
				fg: 'rgb(var(--secondary-fg))',
			},
			hinted: {
				DEFAULT: 'rgb(var(--hinted))',
				fg: 'rgb(var(--hinted-fg))',
			},
			muted: {
				DEFAULT: 'rgb(var(--muted))',
				fg: 'rgb(var(--muted-fg))',
			},
			input: 'rgb(var(--input))',
			divider: 'rgb(var(--divider))',

			red: colors.red,
			green: colors.green,
		},
		fontFamily: {
			sans: `"Roboto", ui-sans-serif, sans-serif`,
			mono: `"JetBrains Mono NL", ui-monospace, monospace`,
		},
	},
	plugins: [
		// forms(),
	],
};

import { cva } from 'class-variance-authority';

import button from './button.ts';

export const content = cva(
	'flex w-full max-w-md max-h-[80%] flex-col overflow-hidden rounded-t-md bg-background pt-1 align-middle shadow-xl sm:rounded-md sm:pt-0',
);

export const title = cva('px-4 py-3 font-bold shrink-0');

export const item = cva(
	'cursor-pointer flex items-center gap-4 px-4 py-3 text-left text-sm hover:bg-hinted disabled:pointer-events-none disabled:opacity-50',
);

export const cancel = cva(
	button({ color: 'outline', class: 'mx-4 mt-3 mb-6 justify-center shrink-0 sm:mb-4' }),
);

import { cva } from 'class-variance-authority';

import button from './button.ts';

export const content = cva(
	'flex w-full max-w-md flex-col overflow-hidden rounded-t-md bg-background pt-1 align-middle shadow-xl sm:rounded-md sm:pt-0',
);

export const title = cva('px-4 py-3 font-bold');

export const item = cva(
	'cursor-pointer px-4 py-3 text-left text-sm hover:bg-hinted disabled:pointer-events-none disabled:opacity-50',
);

export const cancel = cva(button({ color: 'outline', class: 'mx-4 my-3 justify-center' }));

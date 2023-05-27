import { cva } from 'class-variance-authority';

export const content = cva(
	'flex w-full max-w-md flex-col overflow-hidden rounded-t-md bg-background p-4 align-middle shadow-xl sm:rounded-md',
);

export const title = cva('text-base font-bold');

export const actions = cva('mt-6 flex justify-end gap-3');

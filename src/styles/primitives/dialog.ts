import { cva } from 'class-variance-authority';

export const content = cva(
	'flex w-full max-w-md max-h-[80%] flex-col overflow-hidden rounded-t-md bg-background p-4 pb-6 align-middle shadow-xl sm:rounded-md sm:pb-4',
);

export const title = cva('text-base font-bold break-words shrink-0');

export const actions = cva('mt-3 flex justify-end gap-3 shrink-0');

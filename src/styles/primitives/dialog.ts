import { cva } from 'class-variance-authority';

export const overlay = cva('fixed inset-0 z-20 bg-black bg-opacity-25');

export const positioner = cva(
	'fixed inset-0 z-20 flex min-h-full items-end justify-center overflow-y-auto sm:items-center sm:p-4',
);

export const content = cva(
	'flex w-full max-w-md flex-col overflow-hidden rounded-t-md bg-background p-6 align-middle shadow-xl sm:rounded-md',
);

export const title = cva('text-base font-bold');

export const actions = cva('mt-6 flex justify-end gap-3');

import { cva } from 'class-variance-authority';

export const dropdownMenu = cva('bg-background rounded-md shadow-md flex flex-col border border-divider');

export const dropdownItem = cva(
	'px-4 py-2 text-left text-sm cursor-pointer hover:bg-hinted ui-disabled:opacity-50 ui-disabled:pointer-events-none',
);

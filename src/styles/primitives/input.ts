import { cva } from 'class-variance-authority';

const input = cva(
	'block h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-fg focus:outline-2 focus:-outline-offset-1 focus:outline-accent disabled:opacity-50',
);

export default input;

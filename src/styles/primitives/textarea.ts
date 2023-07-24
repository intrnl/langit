import { cva } from 'class-variance-authority';

const textarea = cva(
	'block w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-fg focus:outline-2 focus:-outline-offset-1 focus:outline-accent disabled:opacity-50',
);

export default textarea;

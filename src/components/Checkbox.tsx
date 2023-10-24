import type { ComponentProps } from 'solid-js';

import CheckBoxIcon from '~/icons/baseline-check-box.tsx';
import CheckBoxOutlineBlankIcon from '~/icons/baseline-check-box-outline-blank.tsx';

const Checkbox = (props: ComponentProps<'input'>) => {
	return (
		<label class="relative inline-flex  cursor-pointer text-xl">
			<input {...props} type="checkbox" class="peer h-0 w-0 appearance-none leading-none" />

			<div class="pointer-events-none absolute -inset-1.5 rounded-full peer-hover:bg-hinted peer-focus-visible:bg-hinted" />

			<CheckBoxOutlineBlankIcon class="z-10 text-muted-fg peer-checked:hidden peer-disabled:opacity-50" />
			<CheckBoxIcon class="z-10 hidden text-accent peer-checked:block peer-disabled:opacity-50" />
		</label>
	);
};

export default Checkbox;

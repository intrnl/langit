import { splitProps } from 'solid-js';

import { A, type AnchorWithParamProps, type Paths } from '~/router';

const TabLink = <P extends Paths>(props: AnchorWithParamProps<P>) => {
	const [a, b] = splitProps(props, ['children']);

	return (
		// @ts-expect-error
		<A
			{...b}
			class='group grow flex justify-center text-sm text-muted-fg font-bold min-w-14 h-13 px-4 hover:bg-hinted'
			activeClass='text-primary is-active'
		>
			<div class='relative w-max h-full flex items-center'>
				<span>{a.children}</span>
				<div class='hidden group-[.is-active]:block h-1 bg-accent absolute bottom-0 -inset-x-1 rounded' />
			</div>
		</A>
	);
};

export default TabLink;

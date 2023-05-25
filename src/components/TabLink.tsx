import { splitProps } from 'solid-js';

import { A, type AnchorWithParamProps, type Paths } from '~/router';

const TabLink = <P extends Paths>(props: AnchorWithParamProps<P>) => {
	const [a, b] = splitProps(props, ['children']);

	return (
		// @ts-expect-error
		<A
			{...b}
			class="group flex h-13 min-w-14 grow justify-center px-4 text-sm font-bold text-muted-fg hover:bg-hinted"
			activeClass="text-primary is-active"
		>
			<div class="relative flex h-full w-max items-center">
				<span>{a.children}</span>
				<div class="absolute -inset-x-1 bottom-0 hidden h-1 rounded bg-accent group-[.is-active]:block" />
			</div>
		</A>
	);
};

export default TabLink;

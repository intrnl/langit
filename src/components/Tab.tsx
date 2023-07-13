import { type ComponentProps, type ValidComponent, splitProps } from 'solid-js';
import type { JSX } from 'solid-js/jsx-runtime';
import { Dynamic } from 'solid-js/web';

import { A, type AnchorWithParamProps, type Paths } from '~/router';

export const Tab = <C extends ValidComponent>(
	props: { component: C; active?: boolean; children?: JSX.Element } & ComponentProps<C>,
) => {
	const [a, b] = splitProps(props, ['children', 'active']);

	return (
		// @ts-expect-error
		<Dynamic
			{...b}
			class="group flex h-full min-w-14 shrink-0 grow justify-center whitespace-nowrap px-4 text-sm font-bold text-muted-fg hover:bg-hinted"
			classList={{ 'text-primary is-active': a.active }}
		>
			<div class="relative flex h-full w-max items-center">
				<span>{a.children}</span>
				<div class="absolute -inset-x-1 bottom-0 hidden h-1 rounded bg-accent group-[.is-active]:block" />
			</div>
		</Dynamic>
	);
};

export const TabLink = <P extends Paths>(props: AnchorWithParamProps<P>) => {
	const [a, b] = splitProps(props, ['children']);

	return (
		// @ts-expect-error
		<A
			{...b}
			class="group flex h-full min-w-14 shrink-0 grow justify-center whitespace-nowrap px-4 text-sm font-bold text-muted-fg hover:bg-hinted"
			activeClass="text-primary is-active"
		>
			<div class="relative flex h-full w-max items-center">
				<span>{a.children}</span>
				<div class="absolute -inset-x-1 bottom-0 hidden h-1 rounded bg-accent group-[.is-active]:block" />
			</div>
		</A>
	);
};

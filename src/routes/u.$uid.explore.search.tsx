import { type ComponentProps, createMemo, splitProps } from 'solid-js';

import { Outlet, useLocation, useNavigate, useSearchParams } from '@solidjs/router';

import { useParams } from '~/router.ts';
import { createDerivedSignal } from '~/utils/hooks.ts';
import { model } from '~/utils/misc.ts';

import input from '~/styles/primitives/input.ts';

const AuthenticatedSearchPage = () => {
	const [searchParams, setSearchParams] = useSearchParams<{ q?: string }>();

	const params = useParams('/u/:uid/explore/search');
	const location = useLocation();
	const navigate = useNavigate();

	const [query, setQuery] = createDerivedSignal(() => searchParams.q || '');
	const type = createMemo(() => {
		const path = location.pathname;
		const idx = path.lastIndexOf('/');

		return path.slice(idx + 1);
	});

	const nav = (next: string) => {
		const path = `/u/${params.uid}/explore/search/${next}${location.search}`;
		navigate(path, { replace: true });
	};

	return (
		<div class="flex flex-col">
			<div class="sticky top-0 z-20">
				<div class="flex h-13 items-center gap-4 px-4">
					<input
						ref={model(query, setQuery)}
						placeholder="Search Bluesky"
						class={input()}
						onKeyDown={(ev) => {
							if (ev.key === 'Enter') {
								const value = query().trim();

								if (value) {
									setSearchParams({ q: value });
								}
							}
						}}
					/>
				</div>

				<div class="flex overflow-x-auto">
					<Tab active={type() === 'posts'} onClick={() => nav('posts')}>
						Posts
					</Tab>
					<Tab active={type() === 'users'} onClick={() => nav('users')}>
						People
					</Tab>
				</div>

				<hr class="border-divider" />
			</div>

			<Outlet />
		</div>
	);
};

export default AuthenticatedSearchPage;

const Tab = (props: Omit<ComponentProps<'button'>, 'class' | 'classList'> & { active?: boolean }) => {
	const [a, b] = splitProps(props, ['children', 'active']);

	return (
		<button
			{...b}
			class="group flex h-13 min-w-14 grow justify-center px-4 text-sm font-bold text-muted-fg hover:bg-hinted"
			classList={{ 'text-primary is-active': a.active }}
		>
			<div class="relative flex h-full w-max items-center">
				<span>{a.children}</span>
				<div class="absolute -inset-x-1 bottom-0 hidden h-1 rounded bg-accent group-[.is-active]:block" />
			</div>
		</button>
	);
};

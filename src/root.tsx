import { Outlet } from '@solidjs/router';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';

import { ModalProvider, closeModal, openModal } from '~/globals/modals.tsx';

import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
		},
	},
});

const Root = () => {
	openModal(
		() => (
			<div class={/* @once */ dialog.content()}>
				<h1 class={/* @once */ dialog.title()}>Langit is moving...</h1>

				<p class="mt-3 text-sm">
					Langit is moving to a different site,{' '}
					<a target="_blank" href="https://langit.pages.dev" class="text-accent hover:underline">
						langit.pages.dev
					</a>
					.
				</p>
				<p class="mt-2 text-sm">
					You can continue to use Langit on this site, but so long as you don't update your bookmarks to point
					to the new site, you won't be receiving any future updates and you'll always be nagged with
					this dialog. <span class="text-muted-fg">(not fun!)</span>
				</p>
				<p class="mt-2 text-sm">
					Thanks for using Langit, certainly wasn't expecting people to be using it. -intrnl
				</p>

				<div class={/* @once */ dialog.actions()}>
					<button
						onClick={() => {
							closeModal();
						}}
						class={/* @once */ button({ color: 'primary' })}
					>
						Continue anyway
					</button>
				</div>
			</div>
		),
		{ disableBackdropClose: true },
	);

	return (
		<QueryClientProvider client={queryClient}>
			<Outlet />
			<ModalProvider />
		</QueryClientProvider>
	);
};

export default Root;

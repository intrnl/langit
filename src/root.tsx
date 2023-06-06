import { Outlet } from '@solidjs/router';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';

import { ModalProvider } from '~/globals/modals.tsx';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false,
		},
	},
});

const Root = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<Outlet />
			<ModalProvider />
		</QueryClientProvider>
	);
};

export default Root;

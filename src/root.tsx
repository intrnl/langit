import { Outlet } from '@solidjs/router';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';

const queryClient = new QueryClient();

const Root = () => {
	return (
		<QueryClientProvider client={queryClient}>
			<Outlet />
		</QueryClientProvider>
	);
};

export default Root;

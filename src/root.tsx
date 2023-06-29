import { MetaProvider, Title } from '@solidjs/meta';
import { Outlet } from '@solidjs/router';

import { ModalProvider } from '~/globals/modals.tsx';

const Root = () => {
	return (
		<MetaProvider>
			<Title>Langit</Title>

			<Outlet />
			<ModalProvider />
		</MetaProvider>
	);
};

export default Root;

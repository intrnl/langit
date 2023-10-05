import { Outlet } from '@solidjs/router';

import { ModalProvider } from '~/globals/modals.tsx';
import { MetaProvider, Title } from '~/utils/meta.tsx';

const Root = () => {
	return (
		<MetaProvider>
			<Title render="Langit" />

			<Outlet />
			<ModalProvider />
		</MetaProvider>
	);
};

export default Root;

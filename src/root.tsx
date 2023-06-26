import { Outlet } from '@solidjs/router';

import { ModalProvider } from '~/globals/modals.tsx';

const Root = () => {
	return (
		<>
			<Outlet />
			<ModalProvider />
		</>
	);
};

export default Root;

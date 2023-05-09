import { Outlet } from '@solidjs/router';

const AuthLayout = () => {
	return (
		<div class='max-w-xl mx-auto'>
			<Outlet />
		</div>
	);
};

export default AuthLayout;

import { Outlet } from '@solidjs/router';

const AuthLayout = () => {
	return (
		<div class="mx-auto max-w-xl">
			<Outlet />
		</div>
	);
};

export default AuthLayout;

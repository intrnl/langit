import { lazy } from 'solid-js';
import { render } from 'solid-js/web';

import { Router, useRoutes } from '@solidjs/router';

import routes from './router-routes.ts';

import '~/styles/tailwind.css';

const App = () => {
	const Routes = useRoutes([
		{
			path: '/',
			component: lazy(() => import('./root')),
			children: routes,
		},
	]);

	return (
		<Router>
			<Routes />
		</Router>
	);
};

render(() => <App />, document.body);

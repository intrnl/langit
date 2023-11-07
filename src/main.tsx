import { createRenderEffect, createRoot, lazy } from 'solid-js';
import { render } from 'solid-js/web';

import { Router, useRoutes } from '@solidjs/router';

import { getLocalPref } from '~/globals/settings.ts';
import routes from '~/router-routes.ts';
import { useMediaQuery } from '~/utils/media-query.ts';
import '~/utils/service-worker.ts';

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

createRoot(() => {
	createRenderEffect(() => {
		const prefs = getLocalPref();
		const theme = prefs.theme;

		const cl = document.documentElement.classList;

		if (theme === 'auto') {
			const isDark = useMediaQuery('(prefers-color-scheme: dark)');

			createRenderEffect(() => {
				cl.toggle('is-dark', isDark());
			});
		} else {
			cl.toggle('is-dark', theme === 'dark');
		}
	});
});

render(() => <App />, document.body);

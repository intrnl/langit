import { createRenderEffect, createRoot, lazy } from 'solid-js';
import { render } from 'solid-js/web';

import { Router, useRoutes } from '@solidjs/router';

import { type LocalSettings, preferences } from '~/globals/preferences.ts';
import routes from '~/router-routes.ts';
import { useMediaQuery } from '~/utils/media-query.ts';

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
	createRenderEffect((prev: LocalSettings['theme']) => {
		const prefs = preferences.local;
		const theme = prefs?.theme ?? 'auto';

		if (prev === theme) {
			return theme;
		}

		const cl = document.documentElement.classList;

		if (theme === 'auto') {
			const isDark = useMediaQuery('(prefers-color-scheme: dark)');

			createRenderEffect(() => {
				cl.toggle('dark', isDark());
			});
		} else {
			cl.toggle('dark', theme === 'dark');
		}

		return theme;
	});
});

render(() => <App />, document.body);

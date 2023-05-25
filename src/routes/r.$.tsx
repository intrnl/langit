import { Navigate } from '@solidjs/router';

import { multiagent } from '~/api/global.ts';

import { useParams } from '~/router';

const RedirectPage = () => {
	const params = useParams('/r/*');
	const path = params['*'];

	// Attempt to redirect signed-in users.
	let activeId = multiagent.active;

	if (!activeId) {
		// Nothing is registered as active, grab the first account that comes up
		for (activeId in multiagent.accounts) {
			break;
		}
	}

	return (
		<Navigate
			href={
				/* @once */ activeId ? `/u/${activeId}/${path}` : `/login?to=${encodeURIComponent('@uid/' + path)}`
			}
		/>
	);
};

export default RedirectPage;

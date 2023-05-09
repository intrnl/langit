import { Outlet } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { Show, createMemo } from 'solid-js';

import { multiagent } from '~/api/global';
import { getProfile, getProfileKey } from '~/api/query';
import { useParams } from '~/router';

const AuthenticatedLayout = () => {
	const params = useParams('/u/:uid');

	const handle = createMemo(() => {
		return multiagent.accounts[params.uid].session.handle;
	});

	const profileQuery = createQuery(() => getProfileKey(params.uid, handle()), getProfile);

	return (
		<div>
			<Show when={profileQuery.data} keyed>
				{(data) => <div>Hello</div>}
			</Show>

			<Outlet />
		</div>
	);
};

export default AuthenticatedLayout;

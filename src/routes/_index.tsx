import { createEffect } from 'solid-js';

import { multiagent } from '~/globals/agent.ts';
import { A, useNavigate } from '~/router.ts';

import button from '~/styles/primitives/button.ts';

const IndexPage = () => {
	const navigate = useNavigate();

	createEffect(() => {
		// Attempt to redirect signed-in users.
		let activeId = multiagent.active;

		if (!activeId) {
			// Nothing is registered as active, grab the first account that comes up
			for (activeId in multiagent.accounts) {
				break;
			}
		}

		if (activeId) {
			navigate('/u/:uid', { params: { uid: activeId }, replace: true });
		}
	});

	return (
		<div class="mx-auto flex max-w-xl flex-col justify-center px-4 py-8">
			<h1 class="text-lg font-bold">Langit</h1>

			<p>Alternative Bluesky client</p>

			<div class="mt-8 flex gap-4">
				<A href="/login" class={/* @once */ button({ color: 'primary' })}>
					Log in
				</A>
			</div>
		</div>
	);
};

export default IndexPage;

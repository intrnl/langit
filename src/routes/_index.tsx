import { createEffect } from 'solid-js';

import { multiagent } from '~/api/global';
import { A, useNavigate } from '~/router';

import button from '~/styles/primitives/button';

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
		<div class='max-w-xl mx-auto px-4 py-8 flex flex-col justify-center'>
			<h1 class='text-lg font-bold'>Langit</h1>

			<p>Alternative Bluesky client</p>

			<div class='flex mt-8 gap-4'>
				<A href='/login' class={button({ color: 'primary' })}>
					Log in
				</A>

				<A href='/register' class={button({ color: 'outline' })}>
					Sign up
				</A>
			</div>
		</div>
	);
};

export default IndexPage;

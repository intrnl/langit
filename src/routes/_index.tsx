import { createEffect } from 'solid-js';

import { multiagent } from '~/globals/agent.ts';
import { A, useNavigate } from '~/router.ts';

import button from '~/styles/primitives/button.ts';

const isSafari = navigator.vendor.includes('Apple');
const INCOMPATIBLE_NOTE_URL = 'https://github.com/intrnl/langit/wiki/Safari-compatibility-issue';

const GIT_SOURCE = import.meta.env.VITE_GIT_SOURCE;

const GIT_BRANCH = import.meta.env.VITE_GIT_BRANCH;
const GIT_COMMIT = import.meta.env.VITE_GIT_COMMIT;

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
		<div class="mx-auto flex min-h-screen min-w-0 max-w-2xl flex-col border-divider p-4 sm:border-x">
			<div class="flex grow flex-col items-center justify-center">
				<h1 class="text-center text-2xl font-bold">Langit</h1>

				<div class="mt-4 flex w-full max-w-md flex-col gap-2 sm:flex-row sm:justify-center">
					<A href="/login" class={/* @once */ button({ color: 'primary', class: 'justify-center' })}>
						Log in
					</A>
					<button disabled class={/* @once */ button({ color: 'outline', class: 'justify-center' })}>
						Sign up
					</button>
				</div>
			</div>

			{isSafari && (
				<div class="mt-4 flex justify-between gap-4 rounded-md bg-hinted px-4 py-3 text-sm text-secondary-fg">
					<span>Incompatible browser/OS detected.</span>
					<a href={INCOMPATIBLE_NOTE_URL} target="_blank" class="font-medium hover:underline">
						Learn more
					</a>
				</div>
			)}

			{GIT_SOURCE && (
				<p class="mt-4 text-center text-xs text-muted-fg">
					<a href={`${GIT_SOURCE}/commit/${GIT_COMMIT}`} target="_blank" class="hover:underline">
						commit {GIT_BRANCH}/{GIT_COMMIT}
					</a>
					<span> • </span>
					<a href={GIT_SOURCE} target="_blank" class="hover:underline">
						source code
					</a>
				</p>
			)}
		</div>
	);
};

export default IndexPage;

import { createEffect } from 'solid-js';

import { multiagent } from '~/globals/agent.ts';
import { A, useNavigate } from '~/router.ts';

import button from '~/styles/primitives/button.ts';

const isSafari = navigator.vendor.includes('Apple');

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

			{isSafari && (
				<div class="mt-4 rounded-md bg-secondary p-4 text-sm text-secondary-fg">
					<p class="font-bold">Incompatible browser/OS detected</p>
					<p>Looks like you're using an iOS device, or Safari on a macOS device.</p>

					<p class="mt-2">
						Unfortunately, with Safari being unavailable on other platforms like Windows or Linux, and me not
						having an Apple device I can test things on, there's just no way for me to support Langit running
						on an iOS device or Safari on a macOS device.
					</p>

					<p class="mt-2">
						Personally, I cannot justify paying for an expensive device where I'd only be using it to test
						websites, and while I could always rely on your aid to help me fix any issues that may happen,
						it's going to be hard to support Safari that way.
					</p>

					<p class="mt-2">
						Instead, I'd be much happy if the Safari monopoly goes away, and you can visit the{' '}
						<a href="https://open-web-advocacy.org" target="_blank" class="underline">
							Open Web Advocacy website
						</a>{' '}
						for details on that matter.
					</p>
				</div>
			)}

			<div class="mt-8 flex gap-4">
				<A href="/login" class={/* @once */ button({ color: 'primary' })}>
					Log in
				</A>
			</div>
		</div>
	);
};

export default IndexPage;

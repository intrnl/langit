import { createMemo } from 'solid-js';

import * as tldts from 'tldts';

import { closeModal } from '~/globals/modals.tsx';

import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';

export interface LinkWarningDialogProps {
	uri: string;
	onConfirm: () => void;
}

const buildAuth = (url: URL) => {
	const username = url.username;
	const password = url.password;

	return username ? username + (password ? ':' + password : '') + '@' : '';
};
const LinkWarningDialog = (props: LinkWarningDialogProps) => {
	const formattedHref = createMemo(() => {
		const uri = props.uri;

		let url: URL;
		try {
			url = new URL(uri);
		} catch {
			const strong = document.createElement('strong');
			strong.textContent = uri;
			return strong;
		}

		const span = document.createElement('span');
		const strong = document.createElement('strong');

		const hostname = url.hostname;
		const port = url.port;

		const tld = tldts.parse(hostname);
		const domain = tld.domain;
		const subdomain = tld.subdomain;

		let prefix = '';
		let emboldened = '';

		if (domain) {
			if (subdomain) {
				prefix = subdomain + '.';
			}

			emboldened = domain + (port ? ':' + port : '');
		} else {
			emboldened = url.host;
		}

		strong.className = 'text-primary';
		strong.textContent = emboldened;
		span.append(url.protocol + '//' + buildAuth(url) + prefix, strong, url.pathname + url.search + url.hash);
		return span;
	});

	return (
		<div class={/* @once */ dialog.content()}>
			<h1 class={/* @once */ dialog.title()}>Heads up!</h1>

			<p class="my-3 text-sm">This link is taking you to the following site</p>

			<div class="w-full overflow-hidden break-words rounded-md border border-input px-3 py-2 text-sm text-muted-fg">
				{formattedHref()}
			</div>

			<div class={/* @once */ dialog.actions()}>
				<button onClick={closeModal} class={/* @once */ button({ color: 'ghost' })}>
					Cancel
				</button>
				<button
					onClick={() => {
						closeModal();
						props.onConfirm();
					}}
					class={/* @once */ button({ color: 'primary' })}
				>
					Visit
				</button>
			</div>
		</div>
	);
};

export default LinkWarningDialog;

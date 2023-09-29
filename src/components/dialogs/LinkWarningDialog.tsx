import { createMemo } from 'solid-js';

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
	const decor = createMemo((): [prefix: string, main: string, suffix: string] => {
		const $uri = props.uri;

		try {
			const url = new URL($uri);

			return [url.protocol + '//', buildAuth(url) + url.host, url.pathname + url.search + url.hash];
		} catch {
			return ['', $uri, ''];
		}
	});

	return (
		<div class={/* @once */ dialog.content()}>
			<h1 class={/* @once */ dialog.title()}>Heads up!</h1>

			<p class="my-3 text-sm">This link is taking you to the following site</p>

			<div class="w-full break-words overflow-hidden rounded-md border border-input px-3 py-2 text-sm text-muted-fg">
				<span>{decor()[0]}</span>
				<span class="font-semibold text-primary">{decor()[1]}</span>
				<span>{decor()[2]}</span>
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

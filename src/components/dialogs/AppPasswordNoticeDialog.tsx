import { closeModal } from '~/globals/modals.tsx';

import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';

const APP_PASSWORD_LINK = 'https://github.com/bluesky-social/atproto-ecosystem/blob/main/app-passwords.md';

export interface AppPasswordNoticeDialogProps {
	onSubmit: () => void;
}

const AppPasswordNoticeDialog = (props: AppPasswordNoticeDialogProps) => {
	return (
		<div class={/* @once */ dialog.content()}>
			<h1 class={/* @once */ dialog.title()}>Password notice</h1>

			<p class="mt-3 text-sm">
				You seem to be attempting to login with your regular password. For your safety, we recommend using app
				passwords when trying to sign in to third-party clients such as Langit.{' '}
				<a
					href={APP_PASSWORD_LINK}
					target="_blank"
					rel="noopener noreferrer nofollow"
					class="text-accent hover:underline"
				>
					Learn more here
				</a>
				.
			</p>

			<div class={/* @once */ dialog.actions()}>
				<button onClick={closeModal} class={/* @once */ button({ color: 'ghost' })}>
					Cancel
				</button>
				<button
					onClick={() => {
						closeModal();
						props.onSubmit();
					}}
					class={/* @once */ button({ color: 'primary' })}
				>
					Log in anyway
				</button>
			</div>
		</div>
	);
};

export default AppPasswordNoticeDialog;

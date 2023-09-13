import { closeModal } from '~/globals/modals.tsx';

import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';

export interface ConfirmDialogProps {
	title: string;
	body: string;
	confirmation: string;
	onConfirm: () => void;
}

const ConfirmDialog = (props: ConfirmDialogProps) => {
	return (
		<div class={/* @once */ dialog.content()}>
			<h1 class={/* @once */ dialog.title()}>{props.title}</h1>

			<p class="mt-3 text-sm">{props.body}</p>

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
					{props.confirmation}
				</button>
			</div>
		</div>
	);
};

export default ConfirmDialog;

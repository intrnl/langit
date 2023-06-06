import { For, createSignal } from 'solid-js';
import { type JSX } from 'solid-js/jsx-runtime';

import Dialog from '~/components/Dialog.tsx';

type ModalComponent = () => JSX.Element;

export interface ModalOptions {
	disableBackdropClose?: boolean;
}

interface ModalState extends ModalOptions {
	render: ModalComponent;
}

const [modals, setModals] = createSignal<ModalState[]>([]);

export const openModal = (fn: ModalComponent, options?: ModalOptions) => {
	setModals(($modals) => $modals.concat({ render: fn, ...options }));
};

export const closeModal = () => {
	setModals(($modals) => $modals.slice(0, -1));
};

export const resetModals = () => {
	setModals([]);
};

export const ModalProvider = () => {
	return (
		<For each={modals()}>
			{(modal) => (
				<Dialog open onClose={!modal.disableBackdropClose ? closeModal : undefined}>
					{modal.render()}
				</Dialog>
			)}
		</For>
	);
};

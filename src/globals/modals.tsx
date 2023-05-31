import { For, createSignal } from 'solid-js';
import { type JSX } from 'solid-js/jsx-runtime';

import Dialog from '~/components/Dialog.tsx';

type ModalComponent = () => JSX.Element;

const [modals, setModals] = createSignal<ModalComponent[]>([]);

export const openModal = (fn: ModalComponent) => {
	setModals(($modals) => $modals.concat(fn));
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
				<Dialog open onClose={closeModal}>
					{modal()}
				</Dialog>
			)}
		</For>
	);
};

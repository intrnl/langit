import { For, Suspense, createContext, createSignal, useContext } from 'solid-js';
import type { JSX } from 'solid-js/jsx-runtime';

import CircularProgress from '~/components/CircularProgress.tsx';
import Dialog from '~/components/Dialog.tsx';

type ModalComponent = () => JSX.Element;

export interface ModalOptions {
	disableBackdropClose?: boolean;
}

interface ModalState extends ModalOptions {
	id: number;
	render: ModalComponent;
}

interface ModalContextState {
	id: number;
	close: () => void;
}

const [modals, setModals] = createSignal<ModalState[]>([]);
let _id = 0;

const StateContext = createContext<ModalContextState>();

export const openModal = (fn: ModalComponent, options?: ModalOptions) => {
	setModals(($modals) => $modals.concat({ id: _id++, render: fn, ...options }));
};

export const closeModal = () => {
	setModals(($modals) => $modals.slice(0, -1));
};

export const closeModalId = (id: number) => {
	setModals(($modals) => $modals.filter((modal) => modal.id !== id));
};

export const resetModals = () => {
	setModals([]);
};

export const useModalState = () => {
	return useContext(StateContext)!;
};

export const ModalProvider = () => {
	return (
		<For each={modals()}>
			{(modal) => (
				<Dialog open onClose={!modal.disableBackdropClose ? closeModal : undefined}>
					<Suspense
						fallback={
							<div class="my-auto">
								<CircularProgress />
							</div>
						}
					>
						<StateContext.Provider value={{ id: modal.id, close: () => closeModalId(modal.id) }}>
							{modal.render()}
						</StateContext.Provider>
					</Suspense>
				</Dialog>
			)}
		</For>
	);
};

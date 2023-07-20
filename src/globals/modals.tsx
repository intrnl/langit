import { For, Suspense, createContext, createSignal, useContext } from 'solid-js';
import type { JSX } from 'solid-js/jsx-runtime';

import { type Signal, signal } from '~/utils/signals.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import Dialog from '~/components/Dialog.tsx';

type ModalComponent = () => JSX.Element;

export interface ModalOptions {
	disableBackdropClose?: boolean;
}

interface ModalState {
	id: number;
	render: ModalComponent;
	disableBackdropClose: Signal<boolean>;
}

interface ModalContextState {
	id: number;
	close: () => void;
	disableBackdropClose: Signal<boolean>;
}

const [modals, setModals] = createSignal<ModalState[]>([]);
let _id = 0;

const StateContext = createContext<ModalContextState>();

export const openModal = (fn: ModalComponent, options?: ModalOptions) => {
	setModals(($modals) => {
		return $modals.concat({
			id: _id++,
			render: fn,
			disableBackdropClose: signal(options?.disableBackdropClose ?? false),
		});
	});
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
				<Dialog open onClose={() => modal.disableBackdropClose.value || closeModal()}>
					<Suspense
						fallback={
							<div class="my-auto">
								<CircularProgress />
							</div>
						}
					>
						<StateContext.Provider
							value={{
								id: modal.id,
								close: () => closeModalId(modal.id),
								disableBackdropClose: modal.disableBackdropClose,
							}}
						>
							{modal.render()}
						</StateContext.Provider>
					</Suspense>
				</Dialog>
			)}
		</For>
	);
};

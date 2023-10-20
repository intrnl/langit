import { For, Suspense, createContext, createSignal, useContext } from 'solid-js';
import type { JSX } from 'solid-js/jsx-runtime';

import { type Signal, signal } from '~/utils/signals.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import Dialog from '~/components/Dialog.tsx';

type ModalComponent = () => JSX.Element;

export interface ModalOptions {
	disableBackdropClose?: boolean;
	suspense?: boolean;
}

interface ModalState {
	id: number;
	render: ModalComponent;
	suspense: boolean;
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

const createModalState = (fn: ModalComponent, options?: ModalOptions): ModalState => {
	return {
		id: _id++,
		render: fn,
		suspense: options?.suspense ?? true,
		disableBackdropClose: signal(options?.disableBackdropClose ?? false),
	};
};

export const openModal = (fn: ModalComponent, options?: ModalOptions) => {
	setModals(($modals) => {
		return $modals.concat(createModalState(fn, options));
	});
};

export const replaceModal = (fn: ModalComponent, options?: ModalOptions) => {
	setModals(($modals) => {
		const cloned = $modals.slice(0, -1);
		cloned.push(createModalState(fn, options));

		return cloned;
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
			{(modal) => {
				const render = (suspense: boolean) => {
					if (suspense) {
						return (
							<Suspense
								fallback={
									<div class="my-auto">
										<CircularProgress />
									</div>
								}
							>
								{/* @once */ render(false)}
							</Suspense>
						);
					}

					return (
						<StateContext.Provider
							value={{
								id: modal.id,
								close: () => closeModalId(modal.id),
								disableBackdropClose: modal.disableBackdropClose,
							}}
						>
							{modal.render()}
						</StateContext.Provider>
					);
				};

				return (
					<Dialog open onClose={() => modal.disableBackdropClose.value || closeModal()}>
						{/* @once */ render(modal.suspense)}
					</Dialog>
				);
			}}
		</For>
	);
};

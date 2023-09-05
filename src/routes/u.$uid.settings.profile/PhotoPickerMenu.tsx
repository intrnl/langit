import { closeModal } from '~/globals/modals.tsx';

import * as menu from '~/styles/primitives/menu.ts';

export interface PhotoPickerMenuProps {
	onChoose: () => void;
	onClear: () => void;
}

const PhotoPickerMenu = (props: PhotoPickerMenuProps) => {
	return (
		<div class={/* @once */ menu.content()}>
			<button
				onClick={() => {
					closeModal();
					props.onChoose();
				}}
				class={/* @once */ menu.item()}
			>
				Choose a new image
			</button>

			<button
				onClick={() => {
					closeModal();
					props.onClear();
				}}
				class={/* @once */ menu.item()}
			>
				Remove existing image
			</button>

			<button onClick={closeModal} class={/* @once */ menu.cancel()}>
				Cancel
			</button>
		</div>
	);
};

export default PhotoPickerMenu;

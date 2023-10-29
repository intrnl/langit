import { closeModal } from '~/globals/modals.tsx';

import * as menu from '~/styles/primitives/menu.ts';

import DeleteIcon from '~/icons/baseline-delete.tsx';

export interface ListItemMenuProps {
	onRemove: () => void;
}

const ListItemMenu = (props: ListItemMenuProps) => {
	return (
		<div class={/* @once */ menu.content()}>
			<button
				onClick={() => {
					closeModal();
					props.onRemove();
				}}
				class={/* @once */ menu.item()}
			>
				<DeleteIcon class="text-lg" />
				<span>Remove from list</span>
			</button>

			<button onClick={closeModal} class={/* @once */ menu.cancel()}>
				Cancel
			</button>
		</div>
	);
};

export default ListItemMenu;

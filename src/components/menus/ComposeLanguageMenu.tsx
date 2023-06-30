import { For } from 'solid-js';

import { closeModal, openModal } from '~/globals/modals.tsx';
import { languageNames } from '~/utils/intl/displaynames.ts';

import LanguagePicker from '~/components/pickers/LanguagePicker.tsx';
import * as menu from '~/styles/primitives/menu.ts';

import AddIcon from '~/icons/baseline-add.tsx';
import DeleteIcon from '~/icons/baseline-delete.tsx';
import DragHandleIcon from '~/icons/baseline-drag-handle.tsx';

export interface ComposeLanguageMenuProps {
	languages: string[];
	onChange: (next: string[]) => void;
}

const ComposeLanguageMenu = (props: ComposeLanguageMenuProps) => {
	const languages = () => props.languages;

	return (
		<div class={/* @once */ menu.content()}>
			<div class={/* @once */ menu.title()}>Post language</div>

			<p class="px-4 pb-3 text-sm text-muted-fg">
				What languages are you using for this post? You can set up to a maximum of 3 languages.
			</p>

			<For each={languages()}>
				{(code2, idx) => (
					<div class="flex items-center gap-4 px-4 py-3 text-sm">
						{/* <DragHandleIcon class="text-lg" /> */}

						<span class="grow">{languageNames.of(code2)}</span>

						<button
							title="Remove language"
							onClick={() => {
								const next = languages().slice();
								next.splice(idx(), 1);

								props.onChange(next);
							}}
							class="-my-1.5 -mr-2 flex h-8 w-8 items-center justify-center rounded-full text-lg text-red-500 hover:bg-secondary"
						>
							<DeleteIcon />
						</button>
					</div>
				)}
			</For>

			<button
				disabled={languages().length >= 3}
				onClick={(ev) => {
					openModal(() => (
						<LanguagePicker
							exclude={languages()}
							onPick={(code) => {
								const next = languages().concat(code);
								props.onChange(next);
							}}
						/>
					));
				}}
				class={/* @once */ menu.item()}
			>
				<AddIcon class="text-lg" />
				<span>Add language</span>
			</button>

			<button onClick={closeModal} class={/* @once */ menu.cancel()}>
				Cancel
			</button>
		</div>
	);
};

export default ComposeLanguageMenu;

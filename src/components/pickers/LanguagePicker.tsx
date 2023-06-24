import { Show } from 'solid-js';

import { closeModal } from '~/globals/modals.tsx';
import { systemLanguages } from '~/globals/platform.ts';
import { languageNames } from '~/utils/intl/displaynames.ts';
import { CODE2_TO_CODE3 } from '~/utils/intl/languages.ts';

import * as menu from '~/styles/primitives/menu.ts';

export interface LanguagePickerProps {
	/** Shows additional language options meant for post composing */
	post?: boolean;
	onPick: (next: string) => void;
}

let _sortedLanguages: [string, string][];

const LanguagePicker = (props: LanguagePickerProps) => {
	const sortedLanguages = (_sortedLanguages ||= Object.entries(CODE2_TO_CODE3).sort((a, b) => {
		const aIsSystem = systemLanguages.includes(a[0]);
		const bIsSystem = systemLanguages.includes(b[0]);

		return +bIsSystem - +aIsSystem;
	}));

	const choose = (ev: MouseEvent) => {
		const target = ev.currentTarget as HTMLButtonElement;
		const value = target.dataset.value!;

		closeModal();
		props.onPick(value);
	};

	return (
		<div class={/* @once */ menu.content()}>
			<h1 class={/* @once */ menu.title()}>Choose a language</h1>

			<div class="flex flex-col overflow-y-auto">
				<Show when={props.post}>
					<button data-value="none" onClick={choose} class={/* @once */ menu.item()}>
						None
					</button>
					<button data-value="system" onClick={choose} class={/* @once */ menu.item()}>
						Primary system language ({languageNames.of(systemLanguages[0])})
					</button>
				</Show>

				{sortedLanguages.map(([code2, code3]) => (
					<button data-value={code2} onClick={choose} class={/* @once */ menu.item()}>
						{languageNames.of(code3)}
					</button>
				))}
			</div>

			<button onClick={closeModal} class={/* @once */ menu.cancel()}>
				Cancel
			</button>
		</div>
	);
};

export default LanguagePicker;

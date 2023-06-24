import { Show } from 'solid-js';

import { closeModal } from '~/globals/modals.tsx';
import { systemLanguages } from '~/globals/platform.ts';
import { languageNames } from '~/utils/intl/displaynames.ts';
import { CODE2_TO_CODE3 } from '~/utils/intl/languages.ts';

import * as menu from '~/styles/primitives/menu.ts';

export interface LanguagePickerProps {
	/** Shows additional language options meant for post composing */
	post?: boolean;
	exclude?: string[];
	onPick: (next: string) => void;
}

const createSortedLanguages = () => {
	const map: Record<string, number> = {};
	const oob = systemLanguages.length;

	const score = (value: string) => {
		const raw = systemLanguages.indexOf(value);
		return raw === -1 ? oob : raw;
	};

	return Object.entries(CODE2_TO_CODE3).sort((a, b) => {
		const aLang = a[0];
		const bLang = b[0];

		const aIndex = (map[aLang] ||= score(aLang));
		const bIndex = (map[bLang] ||= score(bLang));

		return aIndex - bIndex;
	});
};

const LanguagePicker = (props: LanguagePickerProps) => {
	const sortedLanguages = createSortedLanguages();

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

				{(() => {
					const excludes = props.exclude;

					return sortedLanguages.map(([code2, code3]) =>
						!excludes || !excludes.includes(code2) ? (
							<button data-value={code2} onClick={choose} class={/* @once */ menu.item()}>
								<span class="grow">{languageNames.of(code3)}</span>
								<span class="font-mono text-muted-fg">{code3}</span>
							</button>
						) : null,
					);
				})()}
			</div>

			<button onClick={closeModal} class={/* @once */ menu.cancel()}>
				Cancel
			</button>
		</div>
	);
};

export default LanguagePicker;

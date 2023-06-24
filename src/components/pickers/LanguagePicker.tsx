import { Show } from 'solid-js';

import { closeModal } from '~/globals/modals.tsx';
import { systemLanguages } from '~/globals/platform.ts';
import { languageNamesStrict } from '~/utils/intl/displaynames.ts';
import { CODE2_TO_CODE3 } from '~/utils/intl/languages.ts';

import * as menu from '~/styles/primitives/menu.ts';

export interface LanguagePickerProps {
	/** Shows additional language options meant for post composing */
	post?: boolean;
	exclude?: string[];
	onPick: (next: string) => void;
}

const createSortedLanguages = () => {
	const oob = systemLanguages.length;

	const score = (value: string) => {
		const raw = systemLanguages.indexOf(value);
		return raw === -1 ? oob : raw;
	};

	return Object.entries(CODE2_TO_CODE3)
		.map(([code2, code3]) => {
			const name = languageNamesStrict.of(code3);

			return {
				score: name !== undefined ? score(code2) : oob + 1,
				value: code2,
				code: code3,
				label: name,
			};
		})
		.sort((a, b) => a.score - b.score);
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
						Primary system language ({languageNamesStrict.of(systemLanguages[0])})
					</button>
				</Show>

				{(() => {
					const excludes = props.exclude;

					return sortedLanguages.map(({ value, code, label }) =>
						!excludes || !excludes.includes(value) ? (
							<button data-value={value} onClick={choose} class={/* @once */ menu.item()}>
								<span class="grow" classList={{ 'text-muted-fg': !label }}>
									{label || 'N/A'}
								</span>
								<span class="font-mono text-muted-fg">{code}</span>
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

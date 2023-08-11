import { type Accessor, createMemo } from 'solid-js';

import { PreferenceHide, PreferenceIgnore, PreferenceWarn } from '~/api/moderation/enums.ts';

import { closeModal } from '~/globals/modals.tsx';
import { assert } from '~/utils/misc.ts';

import * as menu from '~/styles/primitives/menu.ts';

import CheckIcon from '~/icons/baseline-check.tsx';

import type { FilterPrefs, LabelType, LabelTypeGroup } from './types.ts';
import { renderValue } from './FilterItem.tsx';

export interface FilterPickerProps {
	item: LabelType | LabelTypeGroup;
	prefs: Accessor<FilterPrefs>;
}

type ValueChoice = [value: number | undefined, message: string];

const findChosenValue = (choices: ValueChoice[]): ValueChoice => {
	for (let i = 0, l = choices.length; i < l; i++) {
		if (i === l - 1 || choices[i][0] !== undefined) {
			return choices[i];
		}
	}

	assert(false, `shouldn't be here`);
};

const FilterPicker = ({ item, prefs }: FilterPickerProps) => {
	const child = 'groupId' in item;
	const id = item.id;

	const selected = createMemo(() => {
		const $prefs = prefs();

		const localPref = $prefs.local;
		const globalPref = $prefs.global;

		const target = child ? localPref.labels : localPref.groups;
		return target[id] ?? (child || globalPref ? 'none' : PreferenceIgnore);
	});

	const choose = (ev: MouseEvent & { currentTarget: HTMLButtonElement }) => {
		const dataset = ev.currentTarget.dataset;
		const value = dataset.value!;

		if (value === '' + selected()) {
			return;
		}

		const $prefs = prefs();

		const localPref = $prefs.local;
		const globalPref = $prefs.global;

		const coercedValue =
			value === 'none' || (value === '0' && !child && !globalPref) ? undefined : parseInt(value);

		const target = child ? localPref.labels : localPref.groups;
		target[id] = coercedValue;
	};

	const renderOption = (value: 'none' | number | undefined, name: string, description?: string) => {
		return (
			<button
				data-value={value}
				onClick={choose}
				class={/* @once */ menu.item()}
				classList={{ 'group is-active': selected() === value }}
			>
				<div class="grow">
					<p>{name}</p>
					<p class="text-muted-fg">{description}</p>
				</div>
				<CheckIcon class="hidden text-xl text-accent group-[.is-active]:block" />
			</button>
		);
	};

	const renderChildOption = () => {
		const $prefs = prefs();

		const localPref = $prefs.local;
		const globalPref = $prefs.global;

		if (child || globalPref) {
			let chosen: ValueChoice;

			if (child) {
				const groupId = item.groupId;

				if (globalPref) {
					chosen = findChosenValue([
						[localPref.groups[groupId], `Inherited from label group preference`],
						[globalPref.labels[id], `Inherited from global label preference`],
						[globalPref.groups[groupId], `Inherited from global label group preference`],
					]);
				} else {
					chosen = [localPref.groups[groupId], `Inherited from label group preference`];
				}
			} else {
				chosen = [globalPref?.groups[id], `Inherited from global label group preference`];
			}

			return renderOption('none', `Default value (${renderValue(chosen[0])})`, chosen[1]);
		}
	};

	return (
		<div class={/* @once */ menu.content()}>
			<h1 class={/* @once */ menu.title()}>{item.name}</h1>

			<p class="px-4 pb-4 text-[0.8125rem] text-muted-fg">{item.description}</p>

			<div class="flex flex-col overflow-y-auto">
				{renderChildOption()}
				{renderOption(PreferenceIgnore, `Show`, `Show this kind of content`)}
				{renderOption(PreferenceWarn, `Warn`, `Show a warning for this kind of content`)}
				{renderOption(PreferenceHide, `Hide`, `Hide this kind of content entirely`)}
			</div>

			<button onClick={closeModal} class={/* @once */ menu.cancel()}>
				Cancel
			</button>
		</div>
	);
};

export default FilterPicker;

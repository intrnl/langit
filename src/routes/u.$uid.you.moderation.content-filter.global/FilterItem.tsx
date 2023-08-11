import type { Accessor } from 'solid-js';

import { PreferenceHide, PreferenceWarn } from '~/api/moderation/enums.ts';

import { openModal } from '~/globals/modals.tsx';

import type { FilterPrefs, LabelType, LabelTypeGroup } from './types.ts';
import FilterPicker from './FilterPicker.tsx';

export const renderValue = (value: number | undefined) => {
	switch (value) {
		case PreferenceHide:
			return `Hide`;
		case PreferenceWarn:
			return `Warn`;
	}

	return `Show`;
};

export interface LabelItemProps {
	item: LabelType | LabelTypeGroup;
	prefs: Accessor<FilterPrefs>;
}

const LabelItem = ({ item, prefs }: LabelItemProps) => {
	const child = 'groupId' in item;
	const id = item.id;

	const renderOption = () => {
		const $prefs = prefs();

		const localPref = $prefs.local;
		const globalPref = $prefs.global;

		const localVal = child ? localPref.labels[id] : localPref.groups[id];

		if ((child || globalPref) && localVal === undefined) {
			let globalVal: number | undefined;

			if (child) {
				const groupId = item.groupId;
				globalVal = localPref?.groups[groupId] ?? globalPref?.labels[id] ?? globalPref?.groups[groupId];
			} else {
				globalVal = globalPref?.groups[id];
			}

			return `Default${globalPref ? ` (${renderValue(globalVal)})` : ``}`;
		}

		return renderValue(localVal);
	};

	const handleClick = () => {
		openModal(() => <FilterPicker item={item} prefs={prefs} />);
	};

	return (
		<button
			onClick={handleClick}
			class="flex justify-between gap-4 px-4 py-3 text-sm hover:bg-hinted"
			classList={{ 'pl-8': child }}
		>
			<span classList={{ 'font-bold': !child }}>{item.name}</span>
			<span class="text-muted-fg" classList={{ 'font-bold': !child }}>
				{renderOption()}
			</span>
		</button>
	);
};

export default LabelItem;

import { createMemo } from 'solid-js';
import type { DID } from '@intrnl/bluesky-client/atp-schema';

import type { ModerationLabelOpts } from '~/api/moderation/types.ts';

import { getAccountModerationPreferences } from '~/globals/preferences.ts';

import { type FilterPrefs, LABEL_TYPES } from './types.ts';

import LabelItem from './FilterItem.tsx';

export const TargetGlobal = 1;
export const TargetUser = 2;
export const TargetLabeler = 3;

export type FilterTargetType = 1 | 2 | 3;

export interface GlobalFilterTarget {
	type: 1;
}

export interface UserFilterTarget {
	type: 2;
	// did: DID;
	prefs: ModerationLabelOpts;
}

export interface LabelerFilterTarget {
	type: 3;
	// did: DID;
	prefs: ModerationLabelOpts;
}

export type FilterTarget = GlobalFilterTarget | UserFilterTarget | LabelerFilterTarget;

export interface FilterOptionsProps {
	uid: DID;
	target: FilterTarget;
}

const FilterOptions = (props: FilterOptionsProps) => {
	const uid = () => props.uid;
	const target = () => props.target;

	const prefs = createMemo<FilterPrefs>(() => {
		const $prefs = getAccountModerationPreferences(uid());
		const $globals = $prefs.globals;

		const $target = target();

		if ($target.type === TargetGlobal) {
			return { global: undefined, local: $globals };
		} else {
			return { global: $globals, local: $target.prefs };
		}
	});

	return (
		<div class="mb-4 flex flex-col gap-2">
			{LABEL_TYPES.map((group) => (
				<div class="flex flex-col">
					<LabelItem item={group} prefs={prefs} />

					{group.children.map((child) => (
						<LabelItem item={child} prefs={prefs} />
					))}
				</div>
			))}
		</div>
	);
};

export default FilterOptions;

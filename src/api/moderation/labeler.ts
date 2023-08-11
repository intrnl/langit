import { createRoot } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';

import { getAccountModerationPreferences } from '~/globals/preferences.ts';
import { createLazyMemo } from '~/utils/hooks.ts';
import type { Signal } from '~/utils/signals.ts';

import { /* type ModerationDecision, */ createModerationDecision } from './internal/action.ts';
import type { Label } from './types.ts';

// // We don't want to commit subjects like posts or profiles to cache just so we
// // can avoid double work on creating a moderation decision on it, I think this
// // might be an okay compromise, we'll have to make sure that the temporary
// // decision is only reused once.
// const tempMap = new WeakMap<Label[], ModerationDecision | undefined>();

export const temporarilyLabel = (uid: DID, userDid: DID, labels: Label[]) => {
	// if (tempMap.has(labels)) {
	// 	return tempMap.get(labels);
	// }

	const prefs = getAccountModerationPreferences(uid);
	const decision = createModerationDecision(labels, userDid, prefs);

	// tempMap.set(labels, decision);
	return decision;
};

export const createModerationLabeler = (uid: DID, userDid: DID, labels: Signal<Label[] | undefined>) => {
	const prefs = getAccountModerationPreferences(uid);

	return createRoot(() => {
		return createLazyMemo(() => {
			const $labels = labels.value;

			// if (tempMap.has($labels)) {
			// 	const decision = tempMap.get($labels);

			// 	tempMap.delete($labels);
			// 	return decision;
			// }

			if ($labels) {
				return createModerationDecision($labels, userDid, prefs);
			}
		});
	});
};

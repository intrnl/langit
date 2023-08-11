import type { DID } from '@intrnl/bluesky-client/atp-schema';

import {
	ActionAlert,
	ActionBlur,
	ActionBlurMedia,
	FlagNoOverride,
	PreferenceHide,
	PreferenceWarn,
} from '../enums.ts';
import type { Label, LabelDefinition, ModerationOpts } from '../types.ts';

import { LABELS } from '../labels.ts';

export interface ModerationCause {
	labeler: string;
	label: Label;
	labelDef: LabelDefinition;
	setting: number;
	priority: number;
}

export interface ModerationDecision {
	// causes: ModerationCause[];

	labeler: string;
	label: Label;
	labelDef: LabelDefinition;

	filter: boolean;
	alert: boolean;
	blur: boolean;
	blurMedia: boolean;
}

export const createModerationDecision = (
	labels: Label[],
	userDid: DID,
	opts: ModerationOpts,
): ModerationDecision | undefined => {
	const causes: ModerationCause[] = [];
	const globalPref = opts.globals;

	for (let idx = 0, len = labels.length; idx < len; idx++) {
		const label = labels[idx];

		const id = label.val;

		const labelDef = LABELS[id];
		if (!labelDef) {
			continue;
		}

		const groupId = labelDef.group;

		const labeler = label.src;
		const isSelfLabeled = labeler === userDid;

		let labelPref: number | undefined = labelDef.enforce;

		if (labelPref === undefined) {
			if (isSelfLabeled) {
				const userPref = opts.users[labeler];

				labelPref =
					userPref?.labels[id] ??
					userPref?.groups[groupId] ??
					globalPref.labels[id] ??
					globalPref.groups[groupId];
			} else {
				const labelerPref = opts.labelers[labeler];

				if (!labelerPref) {
					continue;
				}

				labelPref =
					labelerPref.labels[id] ??
					labelerPref.groups[groupId] ??
					globalPref.labels[id] ??
					globalPref.groups[groupId];
			}
		}

		// TODO: change it to this when `labels` array is confirmed to only return
		// labels from subscribed label providers (alongside self-labels)
		// let labelPref = labelDef.enforce;

		// if (labelPref === undefined) {
		// 	const localPref = isSelfLabeled ? opts.users[labeler] : opts.labelers[labeler];
		// 	labelPref =
		// 		localPref?.labels[id] ??
		// 		localPref?.groups[groupId] ??
		// 		globalPref.labels[id] ??
		// 		globalPref.groups[groupId];
		// }

		if (labelPref !== PreferenceHide && labelPref !== PreferenceWarn) {
			continue;
		}

		// establish the priority of the label
		let priority: 1 | 2 | 3 | 4 | 5;
		if (labelDef.flags & FlagNoOverride) {
			priority = 1;
		} else if (labelPref === PreferenceHide) {
			priority = 2;
		} else if (labelDef.action === ActionBlur) {
			priority = 3;
		} else if (labelDef.action === ActionBlurMedia) {
			priority = 4;
		} else {
			priority = 5;
		}

		causes.push({
			labeler: labeler,
			label: label,
			labelDef: labelDef,
			setting: labelPref,
			priority: priority,
		});
	}

	if (causes.length > 0) {
		const cause = causes.sort((a, b) => a.priority - b.priority)[0];

		const labelDef = cause.labelDef;
		const action = labelDef.action;

		return {
			// causes: causes,

			labeler: cause.labeler,
			label: cause.label,
			labelDef: labelDef,

			filter: cause.setting === PreferenceHide,
			alert: action === ActionAlert,
			blur: action === ActionBlur,
			blurMedia: action === ActionBlurMedia,
		};
	}
};

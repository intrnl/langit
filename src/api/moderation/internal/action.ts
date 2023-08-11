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
	/** Labeler DID */
	s: string;
	/** Label data */
	l: Label;
	/** Label definition */
	d: LabelDefinition;
	/** User's set preference for this cause */
	v: number;
	/** Priority of the cause */
	p: number;
}

export interface ModerationDecision {
	// c: ModerationCause[];

	/** Labeler DID */
	s: string;
	/** Label data */
	l: Label;
	/** Label definition */
	d: LabelDefinition;

	/** Whether content should be filtered out */
	f: boolean;
	/** Whether content should be shown an alert */
	a: boolean;
	/** Whether content should be blurred (shown a warning), this applies to the whole content */
	b: boolean;
	/** Whether content should be blurred (shown a warning), this applies only to images/videos */
	m: boolean;
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

		const groupId = labelDef.g;

		const labeler = label.src;
		const isSelfLabeled = labeler === userDid;

		let labelPref: number | undefined = labelDef.e;

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
		if (labelDef.f & FlagNoOverride) {
			priority = 1;
		} else if (labelPref === PreferenceHide) {
			priority = 2;
		} else if (labelDef.a === ActionBlur) {
			priority = 3;
		} else if (labelDef.a === ActionBlurMedia) {
			priority = 4;
		} else {
			priority = 5;
		}

		causes.push({
			s: labeler,
			l: label,
			d: labelDef,
			v: labelPref,
			p: priority,
		});
	}

	if (causes.length > 0) {
		const cause = causes.sort((a, b) => a.p - b.p)[0];

		const labelDef = cause.d;
		const action = labelDef.a;

		return {
			// c: causes,

			s: cause.s,
			l: cause.l,
			d: labelDef,

			f: cause.v === PreferenceHide,
			a: action === ActionAlert,
			b: action === ActionBlur,
			m: action === ActionBlurMedia,
		};
	}
};

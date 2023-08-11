import {
	ActionAlert,
	ActionBlur,
	ActionBlurMedia,
	FlagNoOverride,
	PreferenceHide,
	PreferenceWarn,
} from './enums.ts';
import type { LabelDefinitionMap } from './types.ts';

export const LABELS: LabelDefinitionMap = {
	'!hide': {
		group: 'system',
		enforce: PreferenceHide,
		flags: FlagNoOverride,
		action: ActionBlur,
	},
	'!no-promote': {
		group: 'system',
		enforce: PreferenceHide,
		flags: 0,
		action: 0,
	},
	'!warn': {
		group: 'system',
		enforce: PreferenceWarn,
		flags: 0,
		action: ActionBlur,
	},

	'dmca-violation': {
		group: 'legal',
		enforce: PreferenceHide,
		flags: FlagNoOverride,
		action: ActionBlur,
	},
	doxxing: {
		group: 'legal',
		enforce: PreferenceHide,
		flags: FlagNoOverride,
		action: ActionBlur,
	},

	porn: {
		group: 'sexual',
		flags: 0,
		action: ActionBlurMedia,
	},
	sexual: {
		group: 'sexual',
		flags: 0,
		action: ActionBlurMedia,
	},
	nudity: {
		group: 'sexual',
		flags: 0,
		action: ActionBlurMedia,
	},

	nsfl: {
		group: 'violence',
		flags: 0,
		action: ActionBlurMedia,
	},
	corpse: {
		group: 'violence',
		flags: 0,
		action: ActionBlurMedia,
	},
	gore: {
		group: 'violence',
		flags: 0,
		action: ActionBlurMedia,
	},
	torture: {
		group: 'violence',
		flags: 0,
		action: ActionBlur,
	},
	'self-harm': {
		group: 'violence',
		flags: 0,
		action: ActionBlurMedia,
	},

	intolerant: {
		group: 'intolerance',
		flags: 0,
		action: ActionBlur,
	},
	'intolerant-race': {
		group: 'intolerance',
		flags: 0,
		action: ActionBlur,
	},
	'intolerant-gender': {
		group: 'intolerance',
		flags: 0,
		action: ActionBlur,
	},
	'intolerant-sexual-orientation': {
		group: 'intolerance',
		flags: 0,
		action: ActionBlur,
	},
	'intolerant-religion': {
		group: 'intolerance',
		flags: 0,
		action: ActionBlur,
	},
	'icon-intolerant': {
		group: 'intolerance',
		flags: 0,
		action: ActionBlurMedia,
	},

	threat: {
		group: 'rude',
		flags: 0,
		action: ActionBlur,
	},

	spoiler: {
		group: 'curation',
		flags: 0,
		action: ActionBlur,
	},

	spam: {
		group: 'spam',
		flags: 0,
		action: ActionBlur,
	},

	'account-security': {
		group: 'misinfo',
		flags: 0,
		action: ActionBlur,
	},
	'net-abuse': {
		group: 'misinfo',
		flags: 0,
		action: ActionBlur,
	},
	impersonation: {
		group: 'misinfo',
		flags: 0,
		action: ActionAlert,
	},
	scam: {
		group: 'misinfo',
		flags: 0,
		action: ActionAlert,
	},
};

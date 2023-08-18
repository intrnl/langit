import { batch } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';

import { createReactiveLocalStorage } from '~/api/storage.ts';
import type { ModerationOpts } from '~/api/moderation/types.ts';

export const preferences = createReactiveLocalStorage<PreferencesStore>('prefs');

const moderationPreferencesCache: Record<DID, ModerationOpts> = {};

export const getAccountPreferences = (uid: DID) => {
	preferences[uid] ||= {};
	return preferences[uid]!;
};

const createAccountModerationPreferences = (uid: DID): ModerationOpts => {
	return batch(() => {
		const $prefs = getAccountPreferences(uid);

		$prefs.cf_globals ||= { groups: {}, labels: {} };
		$prefs.cf_users ||= {};
		$prefs.cf_labelers ||= {};

		return {
			userDid: uid,
			globals: $prefs.cf_globals,
			labelers: $prefs.cf_labelers,
			users: $prefs.cf_users,
		};
	});
};

export const getAccountModerationPreferences = (uid: DID): ModerationOpts => {
	return (moderationPreferencesCache[uid] ||= createAccountModerationPreferences(uid));
};

export const isProfileTemporarilyMuted = (uid: DID, actor: DID): number | null => {
	const $prefs = getAccountPreferences(uid);
	const mutes = $prefs.pf_tempMutes;

	if (mutes) {
		const date = mutes[actor];
		return date !== undefined && Date.now() < date ? date : null;
	}

	return null;
};

export interface PreferencesStore {
	local?: LocalSettings;
	[account: DID]: AccountSettings | undefined;
}

export interface LocalSettings {
	theme?: 'dark' | 'light' | 'auto';
}

export interface AccountSettings {
	savedFeeds?: string[];
	pinnedFeeds?: string[];

	// content languages
	cl_defaultLanguage?: 'none' | 'system' | (string & {});
	cl_systemLanguage?: boolean;
	cl_unspecified?: boolean;
	cl_codes?: string[];

	// content translations
	ct_language?: 'none' | 'system' | (string & {});
	ct_exclusions?: string[];

	// content filters
	cf_globals?: ModerationOpts['globals'];
	cf_users?: ModerationOpts['users'];
	cf_labelers?: ModerationOpts['labelers'];

	// post filters
	pf_hideReposts?: DID[];
	pf_tempMutes?: { [user: DID]: number | undefined };
}

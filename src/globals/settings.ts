import { batch } from 'solid-js';

import type { AtUri, DID } from '@externdefs/bluesky-client/atp-schema';

import { PreferenceWarn } from '~/api/moderation/enums.ts';
import type { ModerationOpts } from '~/api/moderation/types.ts';

import { DEFAULT_MODERATION_LABELER, DEFAULT_SERVER } from '~/api/defaults.ts';
import { createReactiveLocalStorage } from '~/api/storage.ts';

import { getAccountData } from '~/globals/agent.ts';

export interface LocalPreference {
	$version: 1;
	/** Application theme */
	theme: 'auto' | 'dark' | 'light';
}

export interface FeedPreference {
	$version: 1;
	/** Saved feeds */
	feeds: { uri: AtUri; name: string; pinned: boolean }[];
}

export interface FilterPreference {
	$version: 1;
	/** Hide reposts by these users from the timeline */
	hideReposts: DID[];
	/** Temporarily hide posts by these users from the timeline */
	tempMutes: { [user: DID]: number | undefined };
}

export interface LanguagePreference {
	$version: 1;
	/** Allow posts with these languages */
	languages: string[];
	/** Allow posts that matches the system's preferred languages */
	useSystemLanguages: boolean;
	/** Default language to use when composing a new post */
	defaultPostLanguage: 'none' | 'system' | (string & {});
	/** Show posts that do not explicitly specify a language */
	allowUnspecified: boolean;
}

export interface ModerationPreference {
	$version: 1;
	/** Global filter preferences */
	globals: ModerationOpts['globals'];
	/** User-level filter preferences */
	users: ModerationOpts['users'];
	/** Labeler-level filter preferences */
	labelers: ModerationOpts['labelers'];
	/** Keyword filters */
	keywords: ModerationOpts['filters'];
}

export interface TranslationPreference {
	$version: 1;
	/** Preferred language to translate posts into */
	to: 'none' | 'system' | (string & {});
	/** Do not offer the option to translate on these languages */
	exclusions: string[];
}

export interface PreferencesSchema {
	global: {
		local?: LocalPreference;
	};
	[user: DID]: {
		feed?: FeedPreference;
		filter?: FilterPreference;
		language?: LanguagePreference;
		moderation?: ModerationPreference;
		translation?: TranslationPreference;
	};
}

type MigrationFn<T> = (version: number, prev: any) => T;

const preferences = createReactiveLocalStorage<PreferencesSchema>('sets');

const migrated = new WeakSet();

const getPref = <Scope extends keyof PreferencesSchema, Namespace extends keyof PreferencesSchema[Scope]>(
	scope: Scope,
	namespace: Namespace,
	migrator: MigrationFn<PreferencesSchema[Scope][Namespace]>,
): NonNullable<PreferencesSchema[Scope][Namespace]> => {
	return batch(() => {
		let scoped = preferences[scope];
		if (!scoped) {
			preferences[scope] ||= {};
			scoped = preferences[scope];
		}

		let raw = scoped[namespace];

		if (!raw || !migrated.has(raw)) {
			raw = scoped[namespace] = raw ? migrator((raw as any).$version, raw) : migrator(0, undefined);
			migrated.add(raw!);
		}

		return raw!;
	});
};

// Preferences
export const getLocalPref = () => {
	return getPref('global', 'local', (version, prev) => {
		if (version === 0) {
			return {
				$version: 1,
				theme: 'auto',
			};
		}

		return prev;
	});
};

export const getLanguagePref = (uid: DID) => {
	return getPref(uid, 'language', (version, prev) => {
		if (version === 0) {
			return {
				$version: 1,
				languages: [],
				useSystemLanguages: true,
				allowUnspecified: true,
				defaultPostLanguage: 'system',
			};
		}

		return prev;
	});
};

export const getTranslationPref = (uid: DID) => {
	return getPref(uid, 'translation', (version, prev) => {
		if (version === 0) {
			return {
				$version: 1,
				to: 'system',
				exclusions: [],
			};
		}

		return prev;
	});
};

export const getModerationPref = (uid: DID) => {
	return getPref(uid, 'moderation', (version, prev) => {
		if (version === 0) {
			const account = getAccountData(uid)!;
			let labelers: ModerationPreference['labelers'];

			if (account.service === DEFAULT_SERVER) {
				labelers = {
					[DEFAULT_MODERATION_LABELER]: {
						groups: {},
						labels: {},
					},
				};
			} else {
				labelers = {};
			}

			return {
				$version: 1,
				globals: {
					groups: {
						sexual: PreferenceWarn,
						violence: PreferenceWarn,
						intolerance: PreferenceWarn,
						rude: PreferenceWarn,
						spam: PreferenceWarn,
						misinfo: PreferenceWarn,
					},
					labels: {},
				},
				users: {},
				labelers: labelers,
				keywords: [],
			};
		}

		return prev;
	});
};

export const getFeedPref = (uid: DID) => {
	return getPref(uid, 'feed', (version, prev) => {
		if (version === 0) {
			const account = getAccountData(uid)!;
			let feeds: FeedPreference['feeds'];

			if (account.service === DEFAULT_SERVER) {
				feeds = [
					{
						name: 'Discover',
						uri: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot',
						pinned: false,
					},
				];
			} else {
				feeds = [];
			}

			return {
				$version: 1,
				feeds: feeds,
			};
		}

		return prev;
	});
};

export const getFilterPref = (uid: DID) => {
	return getPref(uid, 'filter', (version, prev) => {
		if (version === 0) {
			return {
				$version: 1,
				hideReposts: [],
				tempMutes: {},
			};
		}

		return prev;
	});
};

// Moderation
const moderationPreferencesCache: Record<DID, ModerationOpts> = {};

const createAccountModerationOpts = (uid: DID): ModerationOpts => {
	const prefs = getModerationPref(uid);

	return {
		userDid: uid,
		globals: prefs.globals,
		labelers: prefs.labelers,
		users: prefs.users,
		filters: prefs.keywords,
	};
};

export const getAccountModerationOpts = (uid: DID) => {
	return (moderationPreferencesCache[uid] ||= createAccountModerationOpts(uid));
};

export const isProfileTemporarilyMuted = (uid: DID, actor: DID): number | null => {
	const prefs = getFilterPref(uid);
	const mutes = prefs.tempMutes;

	if (mutes) {
		const date = mutes[actor];
		return date !== undefined && Date.now() < date ? date : null;
	}

	return null;
};

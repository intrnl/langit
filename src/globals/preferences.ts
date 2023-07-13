import type { DID } from '@intrnl/bluesky-client/atp-schema';

import { ReactiveLocalStorage } from '~/api/storage.ts';

export const preferences = new ReactiveLocalStorage<PreferencesStore>('prefs');

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

	// post filters
	pf_tempMutes?: { [user: DID]: number | undefined };
}

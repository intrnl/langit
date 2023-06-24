import { ReactiveLocalStorage } from '~/api/storage.ts';
import { type DID } from '~/api/utils.ts';

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
	cl_defaultLanguage?: 'none' | 'system' | (string & {});
	cl_systemLanguage?: boolean;
	cl_unspecified?: boolean;
	cl_codes?: string[];
}

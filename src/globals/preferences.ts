import { ReactiveLocalStorage } from '../api/storage.js';
import { type DID } from '../api/utils.js';

export const preferences = new ReactiveLocalStorage<AccountPreferencesStore>('prefs');

export interface LocalSettings {
	theme?: 'dark' | 'light' | 'auto';
}

export interface AccountPreferencesStore {
	local?: LocalSettings;
	[account: DID]: AccountPreferences | undefined;
}

export interface AccountPreferences {
	savedFeeds?: string[];
	pinnedFeeds?: string[];
}

import { Multiagent } from './multiagent.ts';
import { ReactiveLocalStorage } from './storage.ts';
import { type DID } from './utils.ts';

export const multiagent = new Multiagent('store');
export const preferences = new ReactiveLocalStorage<AccountPreferencesStore>('prefs');

export interface AccountPreferencesStore {
	[account: DID]: AccountPreferences | undefined;
}

export interface AccountPreferences {
	savedFeeds?: string[];
	pinnedFeeds?: string[];
}

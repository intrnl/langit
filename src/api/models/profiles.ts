import { type SignalizedProfile, mergeSignalizedProfile } from '../cache/profiles.ts';
import { type BskyProfileFollow } from '../types.ts';

export const createProfilesPage = (profiles: BskyProfileFollow[]) => {
	const len = profiles.length;
	const arr: SignalizedProfile[] = new Array(len);

	for (let idx = 0; idx < len; idx++) {
		const profile = profiles[idx];
		arr[idx] = mergeSignalizedProfile(profile);
	}

	return arr;
};

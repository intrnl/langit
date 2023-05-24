import { type SignalizedProfile, mergeSignalizedProfile } from '../cache/profiles.js';
import { type BskyProfileFollow } from '../types.js';

export interface ProfilesListPage {
	cursor?: string;
	subject: SignalizedProfile;
	profiles: SignalizedProfile[];
}

export const createProfilesListPage = (
	cursor: string | undefined,
	subject: BskyProfileFollow,
	profiles: BskyProfileFollow[],
): ProfilesListPage => {
	const len = profiles.length;
	const arr: SignalizedProfile[] = new Array(len);

	for (let idx = 0; idx < len; idx++) {
		const profile = profiles[idx];
		arr[idx] = mergeSignalizedProfile(profile);
	}

	return {
		cursor,
		subject: mergeSignalizedProfile(subject),
		profiles: arr,
	};
};

import { type SignalizedProfile, mergeSignalizedProfile } from '../cache/profiles.ts';
import { type BskyProfileFollow } from '../types.ts';

export interface ProfilesListPage {
	cursor?: string;
	subject: SignalizedProfile;
	profiles: SignalizedProfile[];
}

export interface PostProfilesListPage {
	cursor?: string;
	profiles: SignalizedProfile[];
}

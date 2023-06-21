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

export const createProfilesListPage = (
	cursor: string | undefined,
	subject: BskyProfileFollow,
	profiles: BskyProfileFollow[],
): ProfilesListPage => {
	return {
		cursor,
		subject: mergeSignalizedProfile(subject),
		profiles: profiles.map((profile) => mergeSignalizedProfile(profile)),
	};
};

export const createPostProfilesListPage = (
	cursor: string | undefined,
	profiles: BskyProfileFollow[],
): PostProfilesListPage => {
	return {
		cursor,
		profiles: profiles.map((profile) => mergeSignalizedProfile(profile)),
	};
};

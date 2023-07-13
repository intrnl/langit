import type { SignalizedProfile } from '../cache/profiles.ts';

export interface ProfilesListWithSubjectPage {
	cursor?: string;
	subject: SignalizedProfile;
	profiles: SignalizedProfile[];
}

export interface ProfilesListPage {
	cursor?: string;
	profiles: SignalizedProfile[];
}

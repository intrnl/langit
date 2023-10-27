import { type Accessor, createContext } from 'solid-js';

import type { DID } from '@externdefs/bluesky-client/atp-schema';

import type { SignalizedProfile } from '~/api/cache/profiles.ts';

export interface ProfileContextModel {
	uid: Accessor<DID>;
	profile: Accessor<SignalizedProfile>;
}

export const ProfileContext = createContext<ProfileContextModel>();

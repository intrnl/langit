import type { DID } from '@intrnl/bluesky-client/atp-schema';
import type { InitialDataFn, QueryFn } from '@intrnl/sq';

import { multiagent } from '~/globals/agent.ts';

import { type SignalizedProfile, mergeSignalizedProfile, profiles } from '../cache/profiles.ts';
import { isDid } from '../utils.ts';

export const getProfileKey = (uid: DID, actor: string) => ['getProfile', uid, actor] as const;
export const getProfile: QueryFn<SignalizedProfile, ReturnType<typeof getProfileKey>> = async (key) => {
	const [, uid, actor] = key;
	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('app.bsky.actor.getProfile', {
		params: {
			actor: actor,
		},
	});

	const data = response.data;
	const profile = mergeSignalizedProfile(data);

	if (profile.did === uid) {
		const accounts = multiagent.storage.get('accounts');

		multiagent.storage.set('accounts', {
			...accounts,
			[uid]: {
				...accounts[uid],
				profile: {
					displayName: data.displayName,
					handle: data.handle,
					avatar: data.avatar,
				},
			},
		});
	}

	return profile;
};

export const getInitialProfile: InitialDataFn<SignalizedProfile, ReturnType<typeof getProfileKey>> = (
	key,
) => {
	const [, , actor] = key;

	if (isDid(actor)) {
		const ref = profiles[actor];
		const profile = ref?.deref();

		return profile && { data: profile };
	}
};

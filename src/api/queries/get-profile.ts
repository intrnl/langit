import { type QueryFunctionContext } from '@tanstack/solid-query';

import { mergeSignalizedProfile } from '../cache/profiles.ts';
import { multiagent } from '../global.ts';
import { type BskyProfile } from '../types.ts';
import { type DID } from '../utils.ts';

export const getProfileKey = (uid: DID, actor: string) => ['getProfile', uid, actor] as const;
export const getProfile = async (ctx: QueryFunctionContext<ReturnType<typeof getProfileKey>>) => {
	const [, uid, actor] = ctx.queryKey;
	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get({
		method: 'app.bsky.actor.getProfile',
		signal: ctx.signal,
		params: { actor },
	});

	const data = response.data as BskyProfile;
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

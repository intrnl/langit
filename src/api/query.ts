import { QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from './global';
import { UID } from './multiagent';

export const getProfileKey = (uid: UID, handle: string) => ['getProfile', uid, handle] as const;
export const getProfile = async (context: QueryFunctionContext<ReturnType<typeof getProfileKey>>) => {
	const [, uid, handle] = context.queryKey;
	const agent = await multiagent.connect(uid);

	const res = await agent.rpc.get({
		method: 'app.bsky.actor.getProfile',
		signal: context.signal,
		params: {
			actor: handle,
		},
	});

	return res.data;
};

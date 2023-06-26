import { type QueryFn } from '~/lib/solid-query/index.ts';

import { multiagent } from '~/globals/agent.ts';

import { type BskyResolvedDidResponse } from '../types.ts';
import { type DID, isDid } from '../utils.ts';

export const getProfileDidKey = (uid: DID, actor: string) => ['getProfileDid', uid, actor] as const;
export const getProfileDid: QueryFn<DID, ReturnType<typeof getProfileDidKey>> = async (key) => {
	const [, uid, actor] = key;

	if (isDid(actor)) {
		return actor;
	}

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get({
		method: 'com.atproto.identity.resolveHandle',
		params: { handle: actor },
	});

	const data = response.data as BskyResolvedDidResponse;

	return data.did;
};

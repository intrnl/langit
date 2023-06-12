import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '~/globals/agent.ts';

import { type BskyResolvedDidResponse } from '../types.ts';
import { type DID, isDid } from '../utils.ts';

export const getProfileDidKey = (uid: DID, actor: string) => ['getProfileDid', uid, actor] as const;
export const getProfileDid = async (ctx: QueryFunctionContext<ReturnType<typeof getProfileDidKey>>) => {
	const [, uid, actor] = ctx.queryKey;

	if (isDid(actor)) {
		return actor;
	}

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get({
		method: 'com.atproto.identity.resolveHandle',
		signal: ctx.signal,
		params: { handle: actor },
	});

	const data = response.data as BskyResolvedDidResponse;

	return data.did;
};

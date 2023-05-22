import { type QueryFunctionContext } from '@tanstack/solid-query';

import { multiagent } from '../global.ts';
import { type DID } from '../multiagent.ts';
import { type BskyGetInviteCodesResponse } from '../types.ts';

export const getInviteCodesKey = (uid: DID) => ['getInviteCodes', uid] as const;
export const getInviteCodes = async (ctx: QueryFunctionContext<ReturnType<typeof getInviteCodesKey>>) => {
	const [, uid] = ctx.queryKey;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get({
		method: 'com.atproto.server.getAccountInviteCodes',
		signal: ctx.signal,
	});

	const data = response.data as BskyGetInviteCodesResponse;

	return data;
};

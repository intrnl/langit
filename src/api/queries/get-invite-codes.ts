import { type QueryFn } from '~/lib/solid-query/index.ts';

import { multiagent } from '~/globals/agent.ts';

import { type BskyGetInviteCodesResponse } from '../types.ts';
import { type DID } from '../utils.ts';

export const getInviteCodesKey = (uid: DID) => ['getInviteCodes', uid] as const;
export const getInviteCodes: QueryFn<
	BskyGetInviteCodesResponse,
	ReturnType<typeof getInviteCodesKey>
> = async (key) => {
	const [, uid] = key;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get({
		method: 'com.atproto.server.getAccountInviteCodes',
	});

	const data = response.data as BskyGetInviteCodesResponse;

	return data;
};

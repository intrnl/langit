import { type QueryFn } from '@intrnl/sq';

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

	data.codes.sort((a, b) => {
		const aUsed = a.uses.length >= a.available;
		const bUsed = b.uses.length >= b.available;

		if (aUsed === bUsed) {
			const aDate = new Date(a.createdAt);
			const bDate = new Date(b.createdAt);

			return bDate.getTime() - aDate.getTime();
		}

		return aUsed ? 1 : -1;
	});

	return data;
};

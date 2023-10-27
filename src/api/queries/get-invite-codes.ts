import type { DID, ResponseOf } from '@externdefs/bluesky-client/atp-schema';
import type { QueryFn } from '@intrnl/sq';

import { multiagent } from '~/globals/agent.ts';

export const getInviteCodesKey = (uid: DID) => ['getInviteCodes', uid] as const;
export const getInviteCodes: QueryFn<
	ResponseOf<'com.atproto.server.getAccountInviteCodes'>,
	ReturnType<typeof getInviteCodesKey>
> = async (key) => {
	const [, uid] = key;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('com.atproto.server.getAccountInviteCodes', {
		params: {},
	});

	const data = response.data;

	const used: Record<string, boolean> = {};
	const date: Record<string, number> = {};

	data.codes.sort((a, b) => {
		const aCode = a.code;
		const bCode = b.code;

		const aUsed = (used[aCode] ??= a.uses.length >= a.available);
		const bUsed = (used[bCode] ??= b.uses.length >= b.available);

		if (aUsed === bUsed) {
			const aDate = (date[aCode] ??= new Date(a.createdAt).getTime());
			const bDate = (date[bCode] ??= new Date(b.createdAt).getTime());

			return bDate - aDate;
		}

		return aUsed ? 1 : -1;
	});

	return data;
};

import type { DID, ResponseOf } from '@intrnl/bluesky-client/atp-schema';
import type { QueryFn } from '@intrnl/sq';

import { multiagent } from '~/globals/agent.ts';

export const getAppPasswordsKey = (uid: DID) => {
	return ['getAppPasswords', uid] as const;
};
export const getAppPasswords: QueryFn<
	ResponseOf<'com.atproto.server.listAppPasswords'>,
	ReturnType<typeof getAppPasswordsKey>
> = async (key) => {
	const [, uid] = key;

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('com.atproto.server.listAppPasswords', {});

	const data = response.data;

	const date: Record<string, number> = {};

	data.passwords.sort((a, b) => {
		const aDate = (date[a.name] ??= new Date(a.createdAt).getTime());
		const bDate = (date[b.name] ??= new Date(b.createdAt).getTime());

		return bDate - aDate;
	});

	return data;
};

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import type { QueryFn } from '@intrnl/sq';

import { multiagent } from '~/globals/agent.ts';

import { isDid } from '../utils.ts';

export const getProfileDidKey = (uid: DID, actor: string) => ['getProfileDid', uid, actor] as const;
export const getProfileDid: QueryFn<DID, ReturnType<typeof getProfileDidKey>> = async (key) => {
	const [, uid, actor] = key;

	if (isDid(actor)) {
		return actor;
	}

	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.get('com.atproto.identity.resolveHandle', {
		params: {
			handle: actor,
		},
	});

	return response.data.did;
};

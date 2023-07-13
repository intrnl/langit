import type { Agent } from '@intrnl/bluesky-client/agent';
import type { DID } from '@intrnl/bluesky-client/atp-schema';

import { isDid } from '../utils.ts';

const _getDid = async (agent: Agent, actor: string, signal?: AbortSignal) => {
	let did: DID;
	if (isDid(actor)) {
		did = actor;
	} else {
		const response = await agent.rpc.get('com.atproto.identity.resolveHandle', {
			signal: signal,
			params: { handle: actor },
		});

		did = response.data.did;
	}

	return did;
};

export default _getDid;

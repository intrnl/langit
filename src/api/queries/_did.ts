import { type Agent } from '../agent.ts';
import { type DID, isDid } from '../utils.ts';

import { type BskyResolvedDidResponse } from '../types.ts';

const _getDid = async (agent: Agent, actor: string, signal?: AbortSignal) => {
	let did: DID;
	if (isDid(actor)) {
		did = actor;
	} else {
		const res = await agent.rpc.get({
			method: 'com.atproto.identity.resolveHandle',
			signal: signal,
			params: { handle: actor },
		});

		const data = res.data as BskyResolvedDidResponse;
		did = data.did;
	}

	return did;
};

export default _getDid;

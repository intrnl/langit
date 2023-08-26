import type { DID, Records } from '@intrnl/bluesky-client/atp-schema';
import { XRPCError } from '@intrnl/bluesky-client/xrpc-utils';

import { rpc } from './_global.ts';

export const resolveRepo = async (actor: string) => {
	const response = await rpc.get('com.atproto.repo.describeRepo', {
		params: {
			repo: actor,
		},
	});

	const data = response.data;
	return data;
};

export const resolveRecord = async <TCollection extends keyof Records>(
	did: DID,
	collection: TCollection,
	rkey: string,
): Promise<Records[TCollection]> => {
	const response = await rpc.get('com.atproto.repo.getRecord', {
		params: {
			repo: did,
			collection: collection,
			rkey: rkey,
		},
	});

	const data = response.data;
	return data.value as Records[TCollection];
};

export const tryResolveRecord = async <TCollection extends keyof Records>(
	did: DID,
	collection: TCollection,
	rkey: string,
): Promise<Records[TCollection] | null> => {
	try {
		return await resolveRecord(did, collection, rkey);
	} catch (err) {
		if (err instanceof XRPCError) {
			if (err.error === 'InvalidRequest') {
				return null;
			}
		}

		throw err;
	}
};

import type { DID, Records } from '@intrnl/bluesky-client/atp-schema';
import { XRPCError } from '@intrnl/bluesky-client/xrpc-utils';

import { rpc } from './_global.ts';

export const resolveRepository = async (actor: string) => {
	const response = await rpc.get('com.atproto.repo.describeRepo', {
		params: {
			repo: actor,
		},
	});

	const data = response.data;
	return data;
};

export const resolveRecord = async <TCollection extends keyof Records, TCatch extends boolean = false>(
	did: DID,
	collection: TCollection,
	rkey: string,
	caught?: TCatch,
): Promise<TCatch extends true ? Records[TCollection] | null : Records[TCollection]> => {
	if (caught) {
		try {
			return await resolveRecord(did, collection, rkey, false);
		} catch (err) {
			if (err instanceof XRPCError) {
				if (err.error === 'InvalidRequest') {
					// @ts-expect-error
					return null;
				}
			}

			throw err;
		}
	}

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

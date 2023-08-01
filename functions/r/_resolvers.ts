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

export const resolveProfile = async (did: DID) => {
	try {
		const response = await rpc.get('com.atproto.repo.getRecord', {
			params: {
				repo: did,
				collection: 'app.bsky.actor.profile',
				rkey: 'self',
			},
		});

		const data = response.data;
		return data.value as Records['app.bsky.actor.profile'];
	} catch (err) {
		if (err instanceof XRPCError) {
			if (err.error === 'InvalidRequest') {
				return null;
			}
		}

		throw err;
	}
};

export const resolvePost = async (did: DID, post: string) => {
	const response = await rpc.get('com.atproto.repo.getRecord', {
		params: {
			repo: did,
			collection: 'app.bsky.feed.post',
			rkey: post,
		},
	});

	const data = response.data;
	return data.value as Records['app.bsky.feed.post'];
};

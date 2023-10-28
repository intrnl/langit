import type { AtUri, DID } from '@externdefs/bluesky-client/atp-schema';

import { rpc } from './_global.ts';

const isDid = (str: string): str is DID => {
	return str.startsWith('did:');
};

export const getDid = async (actor: string) => {
	let did: DID;
	if (isDid(actor)) {
		did = actor;
	} else {
		const response = await rpc.get('com.atproto.identity.resolveHandle', {
			params: {
				handle: actor,
			},
		});

		did = response.data.did;
	}

	return did;
};

export const getFeedGenerator = async (uri: AtUri) => {
	const response = await rpc.get('app.bsky.feed.getFeedGenerator', {
		params: {
			feed: uri,
		},
	});

	const data = response.data;
	return data.view;
};

export const getPostThread = async (uri: AtUri, height: number, depth: number) => {
	const response = await rpc.get('app.bsky.feed.getPostThread', {
		params: {
			uri: uri,
			parentHeight: height,
			depth: depth,
		},
	});

	const data = response.data;
	return data.thread;
};

export const getProfile = async (actor: string) => {
	const response = await rpc.get('app.bsky.actor.getProfile', {
		params: {
			actor: actor,
		},
	});

	const data = response.data;
	return data;
};

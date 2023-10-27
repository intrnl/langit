import type { DID } from '@externdefs/bluesky-client/atp-schema';

import { multiagent } from '~/globals/agent.ts';

export const uploadBlob = async (uid: DID, blob: Blob) => {
	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.call('com.atproto.repo.uploadBlob', {
		data: blob,
		encoding: blob.type,
	});

	return response.data.blob;
};

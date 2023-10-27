import type { DID, Records } from '@externdefs/bluesky-client/atp-schema';

import { multiagent } from '~/globals/agent.ts';

type PostRecord = Records['app.bsky.feed.post'];

export const createPost = async (uid: DID, record: PostRecord) => {
	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.call('com.atproto.repo.createRecord', {
		data: {
			repo: uid,
			collection: 'app.bsky.feed.post',
			record: record,
		},
	});

	return response.data;
};

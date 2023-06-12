import { multiagent } from '~/globals/agent.ts';

import { type BskyCreateRecordResponse, type BskyPostRecord } from '../types.ts';
import { type DID } from '../utils.ts';

export const createPost = async (uid: DID, record: BskyPostRecord) => {
	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.post({
		method: 'com.atproto.repo.createRecord',
		data: {
			repo: uid,
			collection: 'app.bsky.feed.post',
			record: record,
		},
	});

	const data = response.data as BskyCreateRecordResponse;

	return data;
};

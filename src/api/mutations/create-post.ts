import { multiagent } from '../global.ts';
import { type BskyCreateRecordResponse, type BskyPostRecord } from '../types.ts';

export const createPost = async (uid: string, record: BskyPostRecord) => {
	const session = multiagent.accounts[uid].session;
	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.post({
		method: 'com.atproto.repo.createRecord',
		data: {
			repo: session.did,
			collection: 'app.bsky.feed.post',
			record: record,
		},
	});

	const data = response.data as BskyCreateRecordResponse;

	return data;
};

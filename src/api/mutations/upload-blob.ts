import { multiagent } from '../global.ts';
import { type BskyBlob } from '../types.ts';
import { type DID } from '../utils.ts';

export const uploadBlob = async (uid: DID, blob: Blob) => {
	const agent = await multiagent.connect(uid);

	const response = await agent.rpc.post({
		method: 'com.atproto.repo.uploadBlob',
		data: blob,
		encoding: blob.type,
	});

	const data = response.data.blob as BskyBlob;

	return data;
};

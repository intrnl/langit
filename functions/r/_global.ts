import { XRPC } from '@intrnl/bluesky-client/xrpc';
import type { AtBlob, DID, Procedures, Queries } from '@intrnl/bluesky-client/atp-schema';

export const INSTANCE_URL = `https://bsky.social`;

export const rpc = new XRPC<Queries, Procedures>(INSTANCE_URL);

export const escape = (value: string, isAttribute: boolean) => {
	const str = '' + value;

	let escaped = '';
	let last = 0;

	for (let idx = 0, len = str.length; idx < len; idx++) {
		const char = str.charCodeAt(idx);

		if (char === 38 || char === (isAttribute ? 34 : 60)) {
			escaped += str.substring(last, idx) + ('&#' + char + ';');
			last = idx + 1;
		}
	}

	if (last === 0) {
		return str;
	}

	return escaped + str.substring(last);
};

export const getBlobUrl = (did: DID, blob: AtBlob) => {
	return `${INSTANCE_URL}/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${blob.ref.$link}`;
};

export type ImageType = 'avatar' | 'banner' | 'feed_thumbnail' | 'feed_fullsize';

export const getImageUrl = (did: DID, blob: AtBlob, type: ImageType) => {
	return `https://av-cdn.bsky.app/img/${type}/plain/${did}/${blob.ref.$link}@jpeg`;
};

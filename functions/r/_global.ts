import { XRPC } from '@externdefs/bluesky-client/xrpc';
import type { Procedures, Queries } from '@externdefs/bluesky-client/atp-schema';

export const INSTANCE_URL = `https://bsky.social`;

export const rpc = new XRPC<Queries, Procedures>('https://api.bsky.app');

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

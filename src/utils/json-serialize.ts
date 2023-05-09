// import { CID } from 'multiformats/cid';

import { isTypedJsonBlobRef, isUntypedJsonBlobRef } from './blob-refs';
import { type IpldValue, type JsonValue, jsonToIpld } from './ipld';

export type LexValue =
	| IpldValue
	// | BlobRef
	| Array<LexValue>
	| { [key: string]: LexValue };

export type RepoRecord = Record<string, LexValue>;

// export const lexToIpld = (val: LexValue): IpldValue => {
// 	// walk arrays
// 	if (Array.isArray(val)) {
// 		const len = val.length;
// 		const arr = new Array(len);

// 		for (let idx = 0; idx < len; idx++) {
// 			arr[idx] = lexToIpld(val[idx]);
// 		}

// 		return arr;
// 	}

// 	// objects
// 	if (val && typeof val === 'object') {
// 		// convert blobs, leaving the original encoding so that we don't change CIDs on re-encode
// 		if (val instanceof BlobRef) {
// 			return val.original;
// 		}

// 		// retain cids & bytes
// 		// if (CID.asCID(val) || val instanceof Uint8Array) {
// 		// 	return val;
// 		// }

// 		// walk plain objects
// 		const _val: any = val;
// 		const ret: any = {};

// 		for (const key in _val) {
// 			ret[key] = lexToIpld(_val[key]);
// 		}

// 		return ret;
// 	}

// 	// pass through
// 	return val;
// };

export const ipldToLex = (val: IpldValue): LexValue => {
	// map arrays
	if (Array.isArray(val)) {
		const len = val.length;
		const arr = new Array(len);

		for (let idx = 0; idx < len; idx++) {
			arr[idx] = ipldToLex(val[idx]);
		}

		return arr;
	}

	// objects
	if (val && typeof val === 'object') {
		if (isTypedJsonBlobRef(val) || isUntypedJsonBlobRef(val)) {
			return val;
		}

		// retain cids, bytes
		// if (CID.asCID(val) || val instanceof Uint8Array) {
		// 	return val;
		// }

		// map plain objects
		const _val: any = val;
		const ret: any = {};

		for (const key in _val) {
			ret[key] = ipldToLex(_val[key]);
		}

		return ret;
	}

	// pass through
	return val;
};

// export const lexToJson = (val: LexValue): JsonValue => {
// 	return ipldToJson(lexToIpld(val));
// };

// export const stringifyLex = (val: LexValue): string => {
// 	return JSON.stringify(lexToJson(val));
// };

export const jsonToLex = (val: JsonValue): LexValue => {
	return ipldToLex(jsonToIpld(val));
};

export const jsonStringToLex = (val: string): LexValue => {
	return jsonToLex(JSON.parse(val));
};

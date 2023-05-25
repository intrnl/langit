// import { CID } from 'multiformats/cid';
// import * as ui8 from 'uint8arrays';

export type JsonValue =
	| boolean
	| number
	| string
	| null
	| undefined
	| unknown
	| Array<JsonValue>
	| { [key: string]: JsonValue };

export type IpldValue =
	| JsonValue
	// | CID
	// | Uint8Array
	| Array<IpldValue>
	| { [key: string]: IpldValue };

// @NOTE avoiding use of check.is() here only because it makes
// these implementations slow, and they often live in hot paths.

export const jsonToIpld = (val: JsonValue): IpldValue => {
	// walk arrays
	if (Array.isArray(val)) {
		const len = val.length;
		const arr = new Array(len);

		for (let idx = 0; idx < len; idx++) {
			arr[idx] = jsonToIpld(val[idx]);
		}

		return arr;
	}

	// objects
	if (val && typeof val === 'object') {
		const _val = val as any;

		// check for dag json values
		if (
			(typeof _val['$link'] === 'string' || typeof _val['$bytes'] === 'string') &&
			Object.keys(_val).length === 1
		) {
			return _val;
		}

		// if (typeof _val['$link'] === 'string' && Object.keys(_val).length === 1) {
		// 	return CID.parse(_val['$link']);
		// }

		// if (typeof _val['$bytes'] === 'string' && Object.keys(_val).length === 1) {
		// 	return ui8.fromString(_val['$bytes'], 'base64');
		// }

		// walk plain objects
		const ret: any = {};

		for (const key in _val) {
			ret[key] = jsonToIpld(_val[key]);
		}

		return ret;
	}

	return val;
};

// export const ipldToJson = (val: IpldValue): JsonValue => {
// 	// walk arrays
// 	if (Array.isArray(val)) {
// 		const len = val.length;
// 		const arr = new Array(len);

// 		for (let idx = 0; idx < len; idx++) {
// 			arr[idx] = ipldToJson(val[idx]);
// 		}

// 		return arr;
// 	}

// 	// objects
// 	if (val && typeof val === 'object') {
// 		// convert bytes
// 		// if (val instanceof Uint8Array) {
// 		// 	return {
// 		// 		$bytes: ui8.toString(val, 'base64'),
// 		// 	};
// 		// }

// 		// convert cids
// 		// if (CID.asCID(val)) {
// 		// 	return {
// 		// 		$link: (val as CID).toString(),
// 		// 	};
// 		// }

// 		// walk plain objects
// 		const _val: any = val;
// 		const ret: any = {};

// 		for (const key in val) {
// 			ret[key] = ipldToJson(_val[key]);
// 		}

// 		return ret;
// 	}

// 	// pass through
// 	return val as JsonValue;
// };

export const ipldEquals = (a: IpldValue, b: IpldValue): boolean => {
	// walk arrays
	if (Array.isArray(a) && Array.isArray(b)) {
		const aLen = a.length;
		const bLen = b.length;

		if (aLen !== bLen) {
			return false;
		}

		for (let i = 0; i < aLen; i++) {
			if (!ipldEquals(a[i], b[i])) {
				return false;
			}
		}

		return true;
	}

	// objects
	if (a && b && typeof a === 'object' && typeof b === 'object') {
		// check bytes
		// if (a instanceof Uint8Array && b instanceof Uint8Array) {
		// 	return ui8.equals(a, b);
		// }

		// check cids
		// let aCid: CID | null;
		// let bCid: CID | null;

		// if ((aCid = CID.asCID(a)) && (bCid = CID.asCID(b))) {
		// 	return aCid.equals(bCid);
		// }

		// walk plain objects
		const _a: any = a;
		const _b: any = b;

		const aLen = Object.keys(_a);
		const bLen = Object.keys(_b);

		if (aLen !== bLen) {
			return false;
		}

		for (const key in _a) {
			if (!ipldEquals(_a[key], _b[key])) {
				return false;
			}
		}

		return true;
	}

	return a === b;
};

// import { CID } from 'multiformats/cid';

// import { ipldToJson } from './ipld';

export interface TypedJsonBlobRef {
	$type: 'blob';
	/** CID */
	ref: any;
	mimeType: string;
	size: number;
}

export interface UntypedJsonBlobRef {
	cid: string;
	mimeType: string;
}

export type JsonBlobRef = TypedJsonBlobRef | UntypedJsonBlobRef;

export class BlobRef {
	public original: JsonBlobRef;

	constructor (
		public ref: any,
		public mimeType: string,
		public size: number,
		original?: JsonBlobRef,
	) {
		this.original = original ?? {
			$type: 'blob',
			ref,
			mimeType,
			size,
		};
	}

	static asBlobRef (obj: any): BlobRef | null {
		if (isTypedJsonBlobRef(obj) || isUntypedJsonBlobRef(obj)) {
			return BlobRef.fromJsonRef(obj);
		}

		return null;
	}

	static fromJsonRef (json: JsonBlobRef): BlobRef {
		if (isTypedJsonBlobRef(json)) {
			return new BlobRef(json.ref.$link, json.mimeType, json.size);
		}
		else {
			return new BlobRef(json.cid, json.mimeType, -1, json);
		}
	}

	// ipld (): TypedJsonBlobRef {
	// 	return {
	// 		$type: 'blob',
	// 		ref: this.ref,
	// 		mimeType: this.mimeType,
	// 		size: this.size,
	// 	};
	// }

	// toJSON () {
	// 	return ipldToJson(this.ipld());
	// }
}

export const isTypedJsonBlobRef = (obj: any): obj is TypedJsonBlobRef => {
	return '$type' in obj && obj.$type === 'blob';
};

export const isUntypedJsonBlobRef = (obj: any): obj is UntypedJsonBlobRef => {
	return typeof obj['cid'] === 'string' && typeof obj['mimeType'] === 'string';
};

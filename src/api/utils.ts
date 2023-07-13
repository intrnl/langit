import type { DID } from '@intrnl/bluesky-client/atp-schema';

export const isDid = (value: string): value is DID => {
	return value.startsWith('did:');
};

export const getRecordId = (uri: string) => {
	const idx = uri.lastIndexOf('/');
	return uri.slice(idx + 1);
};

export const getCollectionId = (uri: string) => {
	const first = uri.indexOf('/', 5);
	const second = uri.indexOf('/', first + 1);

	return uri.slice(first + 1, second);
};

export const getRepoId = (uri: string) => {
	const idx = uri.indexOf('/', 5);
	return uri.slice(5, idx);
};

export interface Collection<Data> {
	pages: Data[];
	params: unknown[];
}

export const pushCollection = <Data>(
	collection: Collection<Data> | undefined,
	data: Data,
	param: unknown,
): Collection<Data> => {
	if (collection && param != null) {
		return {
			pages: collection.pages.concat(data),
			params: collection.params.concat(param),
		};
	}

	return {
		pages: [data],
		params: [param],
	};
};

export const getCollectionCursor = <Data, Key extends keyof Data>(
	collection: Collection<Data> | undefined,
	key: Key,
): Data[Key] | undefined => {
	if (collection) {
		const pages = collection.pages;
		const last = pages[pages.length - 1];

		return last[key];
	}
};

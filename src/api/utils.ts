export type DID = `did:${string}`;

export const isDid = (value: string): value is DID => {
	return value.startsWith('did:');
};

export const getRecordId = (uri: string) => {
	const idx = uri.lastIndexOf('/');
	return uri.slice(idx + 1);
};

export const getRepoId = (uri: string) => {
	const idx = uri.indexOf('/', 5);
	return uri.slice(5, idx);
};

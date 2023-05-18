export type DID = `did:${string}`;

export const isDid = (value: string): value is DID => {
	return value.startsWith('did:');
};

export interface DataServer {
	name: string;
	url: string;
}

export const DEFAULT_DATA_SERVERS: DataServer[] = [
	{
		name: 'Bluesky Social',
		url: 'https://bsky.social',
	},
];

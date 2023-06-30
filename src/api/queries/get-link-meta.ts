import { type QueryFn } from '@intrnl/sq';

import { compress } from '~/utils/image.ts';

const LINK_PROXY_ENDPOINT = 'https://cardyb.bsky.app/v1/extract';

interface LinkProxyResponse {
	error: string;
	likely_type: string;
	url: string;
	title: string;
	description: string;
	image: string;
}

export interface LinkMeta {
	uri: string;
	title: string;
	description: string;
	thumb: Blob | undefined;
	record?: {};
}

export const getLinkMetaKey = (url: string) => ['getLinkMeta', url] as const;
export const getLinkMeta: QueryFn<LinkMeta, ReturnType<typeof getLinkMetaKey>> = async (key) => {
	const [, url] = key;

	const response = await fetch(`${LINK_PROXY_ENDPOINT}?url=${encodeURIComponent(url)}`, {
		signal: AbortSignal.timeout(5_000),
	});

	if (!response.ok) {
		throw new Error(`Failed to contact proxy: response error ${response.status}`);
	}

	const data = (await response.json()) as LinkProxyResponse;

	if (data.error != '') {
		throw new Error(`Proxy error: ${data.error}`);
	}

	let thumb: Blob | undefined;
	if (data.image != '') {
		try {
			const response = await fetch(data.image, {
				signal: AbortSignal.timeout(10_000),
			});

			if (!response.ok) {
				throw new Error(`Failed to retrieve image: response error ${response.status}`);
			}

			const blob = await response.blob();
			const result = await compress(blob);

			thumb = result.blob;
		} catch {}
	}

	const meta: LinkMeta = {
		uri: data.url,
		title: data.title,
		description: data.description,
		thumb: thumb,
	};

	return meta;
};

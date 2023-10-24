import type { QueryFn } from '@intrnl/sq';

export interface TrendingTopic {
	tag: string;
	name: string;
	count: number;
}

interface TrendingTopicsResponse {
	tags: TrendingTopic[];
}

const TIMEFRAME = 360; // 6 hours, in minutes

export const getTrendingTopicsKey = () => {
	return ['getTrendingTopics'] as const;
};
export const getTrendingTopics: QueryFn<
	TrendingTopic[],
	ReturnType<typeof getTrendingTopicsKey>
> = async () => {
	const response = await fetch(
		`https://skyfeed-trending-tags.b-cdn.net/xrpc/app.skyfeed.feed.getTrendingTags?minutes=${TIMEFRAME}`,
		{
			// @ts-expect-error
			priority: 'low',
		},
	);

	if (!response.ok) {
		throw new Error(`Response status ${response.ok}`);
	}

	const json = (await response.json()) as TrendingTopicsResponse;

	return json.tags;
};

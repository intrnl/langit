import type { SignalizedFeedGenerator } from '~/api/cache/feed-generators.ts';

export interface FeedsPage {
	cursor?: string;
	feeds: SignalizedFeedGenerator[];
}

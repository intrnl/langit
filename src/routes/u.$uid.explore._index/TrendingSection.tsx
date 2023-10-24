import { For, Match, Switch } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';

import { getTrendingTopics, getTrendingTopicsKey } from '~/api/queries/get-trending-topics.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import { generatePath } from '~/router';

export interface TrendingSectionProps {
	uid: DID;
}

const TrendingSection = (props: TrendingSectionProps) => {
	const [trending] = createQuery({
		key: getTrendingTopicsKey,
		fetch: getTrendingTopics,
		staleTime: 5 * 60_000, // 5 minutes
	});

	return (
		<div class="flex flex-col border-b border-divider">
			<div class="flex h-13 items-center gap-4 px-4">
				<span class="text-base font-bold">Trending now</span>
			</div>

			<Switch>
				<Match when={trending()}>
					{(trending) => (
						<>
							<For each={trending().slice(0, 5)}>
								{(topic) => (
									<a
										link
										href={generatePath('/u/:uid/tags/:tag', { uid: props.uid, tag: topic.name })}
										class="px-4 py-3 text-sm hover:bg-hinted"
									>
										<p class="font-bold">#{topic.name}</p>
										<p class="text-muted-fg">{topic.count} posts</p>
									</a>
								)}
							</For>

							<a
								link
								href={generatePath('/u/:uid/explore/tags', props)}
								class="flex h-13 items-center px-4 text-sm text-accent hover:bg-hinted"
							>
								Show more
							</a>
						</>
					)}
				</Match>

				<Match when>
					<div class="flex h-13 items-center justify-center">
						<CircularProgress />
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default TrendingSection;

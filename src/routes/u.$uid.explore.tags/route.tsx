import { For, Match, Switch } from 'solid-js';

import { createQuery } from '@intrnl/sq';

import { getTrendingTopics, getTrendingTopicsKey } from '~/api/queries/get-trending-topics.ts';

import { Title } from '~/utils/meta.tsx';

import CircularProgress from '~/components/CircularProgress.tsx';

const AuthenticatedExploreTagsPage = () => {
	const [trending] = createQuery({
		key: getTrendingTopicsKey,
		fetch: getTrendingTopics,
		staleTime: 5 * 60_000, // 5 minutes
	});

	return (
		<div class="flex grow flex-col">
			<Title render="Explore trending hashtags / Langit" />

			<div class="sticky top-0 z-10 flex h-13 items-center justify-between gap-4 border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Trending hashtags</p>
			</div>

			<Switch>
				<Match when={trending()}>
					{(trending) => (
						<>
							<For each={trending()}>
								{(topic) => (
									<a class="px-4 py-3 text-sm hover:bg-hinted">
										<p class="font-bold">#{topic.name}</p>
										<p class="text-muted-fg">{topic.count} posts</p>
									</a>
								)}
							</For>
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

export default AuthenticatedExploreTagsPage;

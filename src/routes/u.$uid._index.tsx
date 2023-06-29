import { For, Show, Suspense, createEffect, createMemo } from 'solid-js';

import { Title } from '@solidjs/meta';
import { useSearchParams } from '@solidjs/router';

import { createQuery } from '~/lib/solid-query/index.ts';

import { type DID } from '~/api/utils.ts';

import {
	getFeedGenerator,
	getFeedGeneratorKey,
	getInitialFeedGenerator,
} from '~/api/queries/get-feed-generator.ts';
import {
	type CustomTimelineParams,
	type HomeTimelineParams,
	getTimeline,
	getTimelineKey,
	getTimelineLatest,
	getTimelineLatestKey,
} from '~/api/queries/get-timeline.ts';

import { preferences } from '~/globals/preferences.ts';
import { useParams } from '~/router.ts';

import { Tab } from '~/components/Tab.tsx';
import TimelineList from '~/components/TimelineList.tsx';

const FeedTab = (props: { uid: DID; uri: string; active: boolean; onClick?: () => void }) => {
	const [feed] = createQuery({
		key: () => getFeedGeneratorKey(props.uid, props.uri),
		fetch: getFeedGenerator,
		staleTime: 30_000,
		initialData: getInitialFeedGenerator,
	});

	return (
		<Tab<'button'> component="button" active={props.active} onClick={props.onClick}>
			{feed()?.displayName.value}
		</Tab>
	);
};

const Feed = (props: { uid: DID; params: HomeTimelineParams | CustomTimelineParams }) => {
	const uid = () => props.uid;
	const params = () => props.params;

	const [timeline, { refetch }] = createQuery({
		key: () => getTimelineKey(uid(), params()),
		fetch: getTimeline,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	const [latest, { mutate: mutateLatest }] = createQuery({
		key: () => getTimelineLatestKey(uid(), params()),
		fetch: getTimelineLatest,
		staleTime: 10_000,
		refetchInterval: 30_000,
		enabled: () => {
			if (!timeline() || timeline()!.pages.length < 1 || !timeline()!.pages[0].cid) {
				return false;
			}

			return true;
		},
	});

	createEffect(() => {
		const $timeline = timeline();

		if ($timeline) {
			const pages = $timeline.pages;
			const length = pages.length;

			if (length === 1) {
				mutateLatest({ cid: pages[0].cid });
			}
		}
	});

	return (
		<TimelineList
			uid={uid()}
			timeline={timeline}
			latest={latest}
			onLoadMore={(cursor) => refetch(true, cursor)}
			onRefetch={() => refetch(true)}
		/>
	);
};

const AuthenticatedHome = () => {
	const params = useParams('/u/:uid');
	const [searchParams, setSearchParams] = useSearchParams<{ feed?: string }>();

	const uid = () => params.uid as DID;
	const feed = () => searchParams.feed;

	const pinnedFeeds = createMemo(() => {
		const arr = preferences.get(uid())?.pinnedFeeds;
		return arr && arr.length > 0 ? arr : undefined;
	});

	return (
		<div class="flex grow flex-col">
			<Title>Home / Langit</Title>

			<div
				class="flex h-13 items-center px-4"
				classList={{ 'sticky top-0 z-10 border-b border-divider bg-background': !pinnedFeeds() }}
			>
				<p class="text-base font-bold">Home</p>
			</div>

			<Show when={pinnedFeeds()}>
				<Suspense fallback={<hr class="-mt-px border-divider" />}>
					<div class="sticky top-0 z-10 flex h-13 items-center overflow-x-auto border-b border-divider bg-background">
						<Tab<'button'>
							component="button"
							active={!feed()}
							onClick={() => {
								setSearchParams({ feed: null }, { replace: true });
								window.scrollTo({ top: 0 });
							}}
						>
							Following
						</Tab>

						<For each={pinnedFeeds()}>
							{(uri) => (
								<FeedTab
									uid={uid()}
									uri={uri}
									active={feed() === uri}
									onClick={() => {
										setSearchParams({ feed: uri }, { replace: true });
										window.scrollTo({ top: 0 });
									}}
								/>
							)}
						</For>
					</div>
				</Suspense>
			</Show>

			<Show when={feed() ?? true} keyed>
				{($feed) => {
					const params: HomeTimelineParams | CustomTimelineParams =
						$feed !== true
							? { type: 'custom', uri: $feed }
							: { type: 'home', algorithm: 'reverse-chronological' };

					return <Feed uid={uid()} params={params} />;
				}}
			</Show>
		</div>
	);
};

export default AuthenticatedHome;

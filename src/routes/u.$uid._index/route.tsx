import { For, Show, Suspense, batch, createEffect, createMemo } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { type EnhancedResource, createQuery } from '@intrnl/sq';
import { useSearchParams } from '@solidjs/router';

import type { SignalizedFeedGenerator } from '~/api/cache/feed-generators.ts';
import type { SignalizedList } from '~/api/cache/lists.ts';
import {
	getFeedGenerator,
	getFeedGeneratorKey,
	getInitialFeedGenerator,
} from '~/api/queries/get-feed-generator.ts';
import { getInitialListInfo, getListInfo, getListInfoKey } from '~/api/queries/get-list.ts';
import {
	type FeedTimelineParams,
	type HomeTimelineParams,
	getTimeline,
	getTimelineKey,
	getTimelineLatest,
	getTimelineLatestKey,
	type ListTimelineParams,
} from '~/api/queries/get-timeline.ts';

import { getCollectionId } from '~/api/utils.ts';

import { getAccountPreferences, preferences } from '~/globals/preferences.ts';
import { useParams } from '~/router.ts';
import { ResourceNotFoundError } from '~/utils/batch-fetch.ts';
import { Title } from '~/utils/meta.tsx';
import { assert } from '~/utils/misc.ts';

import { Tab } from '~/components/Tab.tsx';
import TimelineList from '~/components/TimelineList.tsx';

const FeedTab = (props: { uid: DID; uri: string; active: boolean; onClick?: () => void }) => {
	// `uri` is static
	const uri = props.uri;
	const collection = getCollectionId(uri);

	let info: EnhancedResource<SignalizedFeedGenerator | SignalizedList>;

	if (collection === 'app.bsky.feed.generator') {
		[info] = createQuery({
			key: () => getFeedGeneratorKey(props.uid, props.uri),
			fetch: getFeedGenerator,
			staleTime: 30_000,
			initialData: getInitialFeedGenerator,
		});
	} else if (collection === 'app.bsky.graph.list') {
		[info] = createQuery({
			key: () => getListInfoKey(props.uid, props.uri),
			fetch: getListInfo,
			staleTime: 30_000,
			initialData: getInitialListInfo,
		});
	} else {
		assert(false, `expected collection`);
	}

	createEffect(() => {
		if (info.error instanceof ResourceNotFoundError) {
			const $prefs = getAccountPreferences(props.uid);

			const pinned = new Set($prefs.pinnedFeeds);
			let saved = $prefs.savedFeeds || [];

			const savedIdx = saved.indexOf(uri);

			if (savedIdx !== -1) {
				saved = saved.slice();
				saved.splice(savedIdx, 1);
			}

			pinned.delete(uri);

			batch(() => {
				$prefs.savedFeeds = saved;
				$prefs.pinnedFeeds = saved.filter((uri) => pinned.has(uri));
			});
		}
	});

	return (
		<Tab<'button'> component="button" active={props.active} onClick={props.onClick}>
			{info()?.name.value}
		</Tab>
	);
};

const Feed = (props: { uid: DID; params: HomeTimelineParams | FeedTimelineParams }) => {
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
		key: () => {
			const $timeline = timeline();
			if ($timeline && $timeline.pages[0].cid) {
				return getTimelineLatestKey(uid(), params());
			}
		},
		fetch: getTimelineLatest,
		staleTime: 10_000,
		refetchInterval: 30_000,
	});

	createEffect((prev: ReturnType<typeof timeline> | 0) => {
		const next = timeline();

		if (prev !== 0 && next) {
			const pages = next.pages;
			const length = pages.length;

			if (length === 1) {
				mutateLatest({ cid: pages[0].cid });
			}
		}

		return next;
	}, 0 as const);

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
		const arr = preferences[uid()]?.pinnedFeeds;
		return arr && arr.length > 0 ? arr : undefined;
	});

	return (
		<div class="flex grow flex-col">
			<Title render="Home / Langit" />

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
					let params: HomeTimelineParams | FeedTimelineParams | ListTimelineParams;
					if ($feed === true) {
						params = { type: 'home', algorithm: 'reverse-chronological' };
					} else {
						const collection = getCollectionId($feed);

						if (collection === 'app.bsky.feed.generator') {
							params = { type: 'feed', uri: $feed };
						} else if (collection === 'app.bsky.graph.list') {
							params = { type: 'list', uri: $feed };
						} else {
							assert(false, `unexpected collection`);
						}
					}

					// @ts-expect-error
					return <Feed uid={uid()} params={params} />;
				}}
			</Show>
		</div>
	);
};

export default AuthenticatedHome;

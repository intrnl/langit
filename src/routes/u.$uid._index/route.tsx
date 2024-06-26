import { For, Show, createEffect, createMemo } from 'solid-js';

import type { DID } from '@externdefs/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';
import { useSearchParams } from '@solidjs/router';

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

import { getFeedPref, type FeedPreference } from '~/globals/settings.ts';
import { useParams } from '~/router.ts';
import { Title } from '~/utils/meta.tsx';
import { assert } from '~/utils/misc.ts';
import type { UnpackArray } from '~/utils/types.ts';

import { Tab } from '~/components/Tab.tsx';
import TimelineList from '~/components/TimelineList.tsx';

interface FeedTabProps {
	uid: DID;
	item: UnpackArray<FeedPreference['feeds']>;
	active: boolean;
	onClick?: () => void;
}

const FeedTab = (props: FeedTabProps) => {
	// `item` and `item.uri` is expected to be static
	const item = props.item;

	return (
		<Tab<'button'> component="button" active={props.active} onClick={props.onClick}>
			{item.name}
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
		const prefs = getFeedPref(uid());
		const pinned = prefs.feeds.filter((item) => item.pinned);

		return pinned.length > 0 ? pinned : undefined;
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
						{(item) => (
							<FeedTab
								uid={uid()}
								item={item}
								active={feed() === item.uri}
								onClick={() => {
									setSearchParams({ feed: item.uri }, { replace: true });
									window.scrollTo({ top: 0 });
								}}
							/>
						)}
					</For>
				</div>
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

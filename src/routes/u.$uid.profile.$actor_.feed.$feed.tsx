import { Match, Show, Switch, createEffect, createMemo } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';
import { Title } from '@solidjs/meta';

import { favoriteFeed } from '~/api/mutations/favorite-feed.ts';
import {
	createFeedGeneratorUri,
	getFeedGenerator,
	getFeedGeneratorKey,
	getInitialFeedGenerator,
} from '~/api/queries/get-feed-generator.ts';
import { getProfileDid, getProfileDidKey } from '~/api/queries/get-profile-did.ts';
import {
	type CustomTimelineParams,
	getTimeline,
	getTimelineKey,
	getTimelineLatest,
	getTimelineLatestKey,
} from '~/api/queries/get-timeline.ts';

import { preferences } from '~/globals/preferences.ts';
import { A, useParams } from '~/router.ts';

import TimelineList from '~/components/TimelineList.tsx';
import button from '~/styles/primitives/button.ts';

import FavoriteOutlinedIcon from '~/icons/outline-favorite.tsx';
import FavoriteIcon from '~/icons/baseline-favorite';

const AuthenticatedFeedPage = () => {
	const params = useParams('/u/:uid/profile/:actor/feed/:feed');

	const uid = () => params.uid as DID;
	const actor = () => params.actor;
	const feed = () => params.feed;

	const [did] = createQuery({
		key: () => getProfileDidKey(uid(), actor()),
		fetch: getProfileDid,
		staleTime: 60_000,
	});

	const feedUri = () => createFeedGeneratorUri(did()!, feed());
	const feedParams = (): CustomTimelineParams => ({ type: 'custom', uri: feedUri() });

	const [info] = createQuery({
		key: () => getFeedGeneratorKey(uid(), feedUri()),
		fetch: getFeedGenerator,
		staleTime: 60_000,
		initialData: getInitialFeedGenerator,
		enabled: () => !!did(),
	});

	const [timeline, { refetch }] = createQuery({
		key: () => getTimelineKey(uid(), feedParams()),
		fetch: getTimeline,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		enabled: () => !!did(),
	});

	const [latest, { mutate: mutateLatest }] = createQuery({
		key: () => getTimelineLatestKey(uid(), feedParams()),
		fetch: getTimelineLatest,
		staleTime: 10_000,
		refetchInterval: 30_000,
		enabled: () => {
			if (!did() || !timeline() || timeline()!.pages.length < 1 || !timeline()!.pages[0].cid) {
				return false;
			}

			return true;
		},
	});

	const isSaved = createMemo(() => {
		const prefs = preferences[uid()];
		const saved = prefs?.savedFeeds;

		return !!saved && saved.includes(feedUri());
	});

	const toggleSave = () => {
		const prefs = (preferences[uid()] ||= {});
		const saved = prefs?.savedFeeds;

		const uri = feedUri();

		if (isSaved()) {
			const idx = saved!.indexOf(uri);
			const next = saved!.slice();

			next.splice(idx, 1);

			prefs.savedFeeds = next;
		} else {
			const next = saved ? saved.concat(uri) : [uri];

			prefs.savedFeeds = next;
		}
	};

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
		<div class="flex flex-col">
			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<Switch>
					<Match when={!info.error && info()}>
						{(info) => (
							<>
								<Title>Feed ({info().displayName.value}) / Langit</Title>
								<p class="text-base font-bold">{info().displayName.value}</p>
							</>
						)}
					</Match>

					<Match when>
						<Title>Feed ({feed()})</Title>
						<p class="text-base font-bold">Feed</p>
					</Match>
				</Switch>
			</div>

			<Show when={info()}>
				{(info) => {
					const creator = () => info().creator;

					return (
						<>
							<div class="flex flex-col gap-3 border-b border-divider px-4 pb-4 pt-3">
								<div class="flex gap-4">
									<div class="mt-2 grow">
										<p class="break-words text-lg font-bold">{info().displayName.value}</p>
										<p class="text-sm text-muted-fg">
											<span>by </span>
											<A
												href="/u/:uid/profile/:actor"
												params={{ uid: uid(), actor: creator().did }}
												class="hover:underline"
											>
												@{creator().handle.value}
											</A>
										</p>
									</div>

									<div class="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted-fg">
										<Show when={info().avatar.value}>
											{(avatar) => <img src={avatar()} class="h-full w-full" />}
										</Show>
									</div>
								</div>

								<Show when={info().description.value}>
									<div class="whitespace-pre-wrap break-words text-sm">
										{info().$renderedDescription(uid())}
									</div>
								</Show>

								<p class="text-sm text-muted-fg">Liked by {info().likeCount.value} users</p>

								<div class="flex gap-2">
									<button onClick={toggleSave} class={button({ color: isSaved() ? 'outline' : 'primary' })}>
										{isSaved() ? 'Remove feed' : 'Add feed'}
									</button>

									<button
										onClick={() => favoriteFeed(uid(), info())}
										class={/* @once */ button({ color: 'outline' })}
									>
										{info().viewer.like.value ? (
											<FavoriteIcon class="-mx-1.5 text-base text-red-600" />
										) : (
											<FavoriteOutlinedIcon class="-mx-1.5 text-base" />
										)}
									</button>
								</div>
							</div>
						</>
					);
				}}
			</Show>

			<Show when={!info.error}>
				<TimelineList
					uid={uid()}
					timeline={timeline}
					latest={latest}
					onLoadMore={(cursor) => refetch(true, cursor)}
					onRefetch={() => refetch(true)}
				/>
			</Show>
		</div>
	);
};

export default AuthenticatedFeedPage;

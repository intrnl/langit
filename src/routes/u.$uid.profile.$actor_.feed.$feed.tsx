import { Match, Show, Switch, createEffect, createMemo } from 'solid-js';

import { createQuery } from '@intrnl/sq';

import { type DID } from '~/api/utils.ts';

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
import { useParams } from '~/router.ts';

import TimelineList from '~/components/TimelineList';

import AddIcon from '~/icons/baseline-add.tsx';
import DeleteIcon from '~/icons/baseline-delete.tsx';

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
		const prefs = preferences.get(uid());
		const saved = prefs?.savedFeeds;

		return !!saved && saved.includes(feedUri());
	});

	const toggleSave = () => {
		const prefs = preferences.get(uid());
		const saved = prefs?.savedFeeds;

		const uri = feedUri();

		if (isSaved()) {
			const idx = saved!.indexOf(uri);
			const next = saved!.slice();

			next.splice(idx, 1);
			preferences.merge(uid(), { savedFeeds: next });
		} else {
			const next = saved ? saved.concat(uri) : [uri];

			preferences.merge(uid(), { savedFeeds: next });
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
			<div
				class="sticky top-0 z-10 flex h-13 items-center justify-end bg-background px-4"
				classList={{ 'border-b border-divider': !info() }}
			>
				<Switch>
					<Match when={info()}>
						<button
							title={isSaved() ? `Remove feed` : 'Add feed'}
							onClick={toggleSave}
							class="-mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg hover:bg-secondary"
						>
							{isSaved() ? <DeleteIcon /> : <AddIcon />}
						</button>
					</Match>

					<Match when>
						<p class="grow text-base font-bold">Feed</p>
					</Match>
				</Switch>
			</div>

			<Show when={info()}>
				{(feed) => {
					const creator = () => feed().creator;

					return (
						<>
							<div class="flex flex-col gap-3 px-4 pb-4 pt-3">
								<div class="flex gap-4">
									<div class="mt-2 grow">
										<p class="break-words text-lg font-bold">{feed().displayName.value}</p>
										<p class="text-sm text-muted-fg">by @{creator().handle.value}</p>
									</div>

									<div class="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted-fg">
										<Show when={feed().avatar.value}>
											{(avatar) => <img src={avatar()} class="h-full w-full" />}
										</Show>
									</div>
								</div>

								<Show when={feed().description.value}>
									<div class="whitespace-pre-wrap break-words text-sm">
										{feed().$renderedDescription(uid())}
									</div>
								</Show>

								<p class="text-sm text-muted-fg">Liked by {feed().likeCount.value} users</p>
							</div>

							<hr class="sticky z-10 border-divider" style={{ top: `calc(3.25rem - 1px)` }} />
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

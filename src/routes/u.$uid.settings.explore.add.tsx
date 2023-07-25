import { For, Match, Show, Switch, createMemo } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';
import { useNavigate, useSearchParams } from '@solidjs/router';

import { getCollectionCursor, getRecordId, getRepoId } from '~/api/utils.ts';

import { getPopularFeedGenerators, getPopularFeedGeneratorsKey } from '~/api/queries/get-feed-generator.ts';

import { preferences } from '~/globals/preferences.ts';
import { useParams } from '~/router.ts';
import { INTERACTION_TAGS, isElementAltClicked, isElementClicked } from '~/utils/misc.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import SearchInput from '~/components/SearchInput.tsx';

import AddIcon from '~/icons/baseline-add.tsx';
import DeleteIcon from '~/icons/baseline-delete.tsx';

const AuthenticatedAddFeedPage = () => {
	const params = useParams('/u/:uid/settings/explore/add');
	const navigate = useNavigate();

	const uid = () => params.uid as DID;

	const [searchParams, setSearchParams] = useSearchParams<{ q?: string }>();

	const [feeds, { refetch }] = createQuery({
		key: () => getPopularFeedGeneratorsKey(uid(), searchParams.q),
		fetch: getPopularFeedGenerators,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	const prefs = createMemo(() => {
		return (preferences[uid()] ||= {});
	});

	const list = () => {
		const data = !feeds.error && feeds();
		return data ? data.pages.flatMap((page) => page.feeds) : [];
	};

	return (
		<div class="flex flex-col">
			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold leading-5">Discover feeds</p>
			</div>

			<div class="p-4 pb-1">
				<SearchInput
					value={searchParams.q}
					placeholder="Search custom feeds"
					onEnter={(next) => setSearchParams({ q: next }, { replace: true })}
				/>
			</div>

			<Show when={searchParams.q}>
				{(q) => (
					<p class="px-4 pb-2 pt-3 text-sm text-muted-fg">
						Searching for "<span class="whitespace-pre-wrap">{q()}</span>"
					</p>
				)}
			</Show>

			<For each={list()}>
				{(feed) => {
					const isSaved = createMemo(() => {
						const $prefs = prefs();

						const saved = $prefs.savedFeeds;

						return !!saved && saved.includes(feed.uri);
					});

					const toggleSave = () => {
						const $prefs = prefs();
						const saved = ($prefs.savedFeeds ||= []);

						const uri = feed.uri;

						if (isSaved()) {
							const idx = saved.indexOf(uri);

							saved.splice(idx, 1);
						} else {
							saved.push(uri);
						}
					};

					const click = (ev: MouseEvent | KeyboardEvent) => {
						if (!isElementClicked(ev, INTERACTION_TAGS)) {
							return;
						}

						const uri = feed.uri;
						const path = `/u/${uid()}/profile/${getRepoId(uri)}/feed/${getRecordId(uri)}`;

						if (isElementAltClicked(ev)) {
							open(path, '_blank');
						} else {
							navigate(path);
						}
					};

					return (
						<div
							tabindex={0}
							onClick={click}
							onAuxClick={click}
							onKeyDown={click}
							class="flex cursor-pointer flex-col gap-3 px-4 py-3 text-sm hover:bg-hinted"
						>
							<div class="flex items-center gap-4">
								<div class="h-9 w-9 overflow-hidden rounded-md bg-muted-fg">
									<Show when={feed.avatar.value}>
										{(avatar) => <img src={avatar()} class="h-full w-full" />}
									</Show>
								</div>

								<div class="grow">
									<p class="font-bold">{feed.displayName.value}</p>
									<p class="text-muted-fg">by @{feed.creator.handle.value}</p>
								</div>

								<div class="shrink-0">
									<button
										title={isSaved() ? `Remove feed` : 'Add feed'}
										onClick={toggleSave}
										class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-xl hover:bg-secondary"
									>
										{isSaved() ? <DeleteIcon /> : <AddIcon />}
									</button>
								</div>
							</div>

							<Show when={feed.description.value}>
								<div class="whitespace-pre-wrap break-words text-sm">{feed.$renderedDescription(uid())}</div>
							</Show>

							<p class="text-muted-fg">Liked by {feed.likeCount.value} users</p>
						</div>
					);
				}}
			</For>

			<Switch>
				<Match when={feeds.loading}>
					<div class="flex h-13 items-center justify-center border-divider">
						<CircularProgress />
					</div>
				</Match>

				<Match when={!feeds.error && getCollectionCursor(feeds(), 'cursor')}>
					{(cursor) => (
						<button
							onClick={() => refetch(true, cursor())}
							class="flex h-13 items-center justify-center text-sm text-accent hover:bg-hinted disabled:pointer-events-none"
						>
							Show more
						</button>
					)}
				</Match>

				<Match when>
					<div class="flex h-13 items-center justify-center">
						<p class="text-sm text-muted-fg">End of list</p>
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default AuthenticatedAddFeedPage;

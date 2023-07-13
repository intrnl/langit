import { For, Match, Show, Switch, createMemo, createSignal } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';
import { useNavigate } from '@solidjs/router';

import { getRecordId, getRepoId } from '~/api/utils.ts';

import { getPopularFeedGenerators, getPopularFeedGeneratorsKey } from '~/api/queries/get-feed-generator.ts';

import { preferences } from '~/globals/preferences.ts';
import { useParams } from '~/router.ts';
import { useDebouncedValue } from '~/utils/hooks.ts';
import { INTERACTION_TAGS, isElementAltClicked, isElementClicked, model } from '~/utils/misc.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import input from '~/styles/primitives/input.ts';

import AddIcon from '~/icons/baseline-add.tsx';
import DeleteIcon from '~/icons/baseline-delete.tsx';

const AuthenticatedAddFeedPage = () => {
	const params = useParams('/u/:uid/settings/explore/add');
	const navigate = useNavigate();

	const uid = () => params.uid as DID;

	const [search, setSearch] = createSignal('');
	const debouncedSearch = useDebouncedValue(search, 150);

	const [feeds] = createQuery({
		key: () => getPopularFeedGeneratorsKey(uid()),
		fetch: getPopularFeedGenerators,
		staleTime: 120_000,
	});

	const list = createMemo(() => {
		const data = feeds();
		const text = debouncedSearch();

		if (!data) {
			return [];
		}

		return data.filter((item) => item.displayName.peek().toLowerCase().includes(text));
	});

	return (
		<div class="flex flex-col">
			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold leading-5">Discover feeds</p>
			</div>

			<div class="p-4 pb-1">
				<input
					ref={model(search, setSearch)}
					type="text"
					placeholder="Search..."
					class={/* @once */ input()}
				/>
			</div>

			<For each={list()}>
				{(feed) => {
					const isSaved = createMemo(() => {
						const prefs = preferences.get(uid());
						const saved = prefs?.savedFeeds;

						return !!saved && saved.includes(feed.uri);
					});

					const toggleSave = () => {
						const prefs = preferences.get(uid());
						const saved = prefs?.savedFeeds;

						const uri = feed.uri;

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
				<Match when={feeds()}>
					<div class="flex h-13 items-center justify-center">
						<p class="text-sm text-muted-fg">End of list</p>
					</div>
				</Match>

				<Match when>
					<div class="flex h-13 items-center justify-center border-divider">
						<CircularProgress />
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default AuthenticatedAddFeedPage;

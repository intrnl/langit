import { For, Match, Show, Switch, createMemo } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import type { EnhancedResource } from '@intrnl/sq';
import { useNavigate } from '@solidjs/router';

import type { FeedsPage } from '~/api/models/feeds.ts';
import { type Collection, getCollectionCursor, getRepoId, getRecordId } from '~/api/utils.ts';

import { getAccountPreferences } from '~/globals/preferences.ts';
import { generatePath } from '~/router.ts';
import { INTERACTION_TAGS, isElementAltClicked, isElementClicked } from '~/utils/misc.ts';

import CircularProgress from '~/components/CircularProgress.tsx';

import DeleteIcon from '~/icons/baseline-delete.tsx';
import AddIcon from '~/icons/baseline-add.tsx';
import VirtualContainer from './VirtualContainer';

export interface FeedListProps {
	uid: DID;
	feeds: EnhancedResource<Collection<FeedsPage>, string>;
	onLoadMore: (cursor: string) => void;
}

const FeedList = (props: FeedListProps) => {
	// we're destructuring these props because we don't expect these to ever
	// change, they shouldn't.
	const { feeds, onLoadMore } = props;

	const navigate = useNavigate();

	const uid = () => props.uid;

	const prefs = createMemo(() => {
		return getAccountPreferences(uid());
	});

	const list = () => {
		const data = feeds();
		return data ? data.pages.flatMap((page) => page.feeds) : [];
	};

	return (
		<>
			<For each={list()}>
				{(feed) => {
					const isSaved = createMemo(() => {
						const $prefs = prefs();
						const saved = $prefs.savedFeeds;

						return !!saved && saved.includes(feed.uri);
					});

					const toggleSave = () => {
						const $prefs = prefs();
						const uri = feed.uri;

						const saved = $prefs.savedFeeds;

						if (isSaved()) {
							if (saved) {
								const idx = saved.indexOf(uri);
								saved.splice(idx, 1);

								if (saved.length === 0) {
									$prefs.savedFeeds = undefined;
								}
							}
						} else if (saved) {
							saved.push(uri);
						} else {
							$prefs.savedFeeds = [uri];
						}
					};

					const click = (ev: MouseEvent | KeyboardEvent) => {
						if (!isElementClicked(ev, INTERACTION_TAGS)) {
							return;
						}

						const uri = feed.uri;
						const path = generatePath('/u/:uid/profile/:actor/feed/:feed', {
							uid: uid(),
							actor: getRepoId(uri),
							feed: getRecordId(uri),
						});

						if (isElementAltClicked(ev)) {
							open(path, '_blank');
						} else {
							navigate(path);
						}
					};

					return (
						<VirtualContainer key="feed" id={`${feed.did}`}>
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
									<div class="whitespace-pre-wrap break-words text-sm">{feed.$renderedDescription()}</div>
								</Show>

								<p class="text-muted-fg">Liked by {feed.likeCount.value} users</p>
							</div>
						</VirtualContainer>
					);
				}}
			</For>

			<Switch>
				<Match when={feeds.loading}>
					<div class="flex h-13 items-center justify-center border-divider">
						<CircularProgress />
					</div>
				</Match>

				<Match when={getCollectionCursor(feeds(), 'cursor')}>
					{(cursor) => (
						<button
							onClick={() => onLoadMore(cursor())}
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
		</>
	);
};

export default FeedList;

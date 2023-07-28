import { For, Show, Suspense, SuspenseList, batch, createMemo, createSignal } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';
import { useNavigate } from '@solidjs/router';
import {
	DragDropProvider,
	DragDropSensors,
	SortableProvider,
	createSortable,
	transformStyle,
} from '@thisbeyond/solid-dnd';

import { getRecordId, getRepoId } from '~/api/utils.ts';

import {
	getFeedGenerator,
	getFeedGeneratorKey,
	getInitialFeedGenerator,
} from '~/api/queries/get-feed-generator.ts';

import { preferences } from '~/globals/preferences.ts';
import { A, useParams } from '~/router.ts';
import { ConstrainXDragAxis } from '~/utils/dnd.ts';
import { useMediaQuery } from '~/utils/media-query.ts';
import { INTERACTION_TAGS, isElementAltClicked, isElementClicked } from '~/utils/misc.ts';

import CircularProgress from '~/components/CircularProgress.tsx';

import AddIcon from '~/icons/baseline-add.tsx';
import DeleteIcon from '~/icons/baseline-delete.tsx';
import DragHandleIcon from '~/icons/baseline-drag-handle.tsx';
import PushPinIcon from '~/icons/baseline-push-pin.tsx';

type PinToggleHandler = (uri: string, pinned: boolean) => void;
type RemoveHandler = (uri: string) => void;

interface FeedItemProps {
	uid: DID;
	uri: string;
	pinned: boolean;
	editing: boolean;
	onPinToggle: PinToggleHandler;
	onRemove: RemoveHandler;
}

const FeedItem = (props: FeedItemProps) => {
	const sortable = createSortable(props.uri);

	const navigate = useNavigate();

	const feedUri = () => props.uri;
	const pinned = () => props.pinned;
	const editing = () => props.editing;

	const [feed] = createQuery({
		key: () => getFeedGeneratorKey(props.uid, feedUri()),
		fetch: getFeedGenerator,
		staleTime: 30_000,
		initialData: getInitialFeedGenerator,
	});

	const click = (ev: MouseEvent | KeyboardEvent) => {
		if (editing() || !isElementClicked(ev, INTERACTION_TAGS)) {
			return;
		}

		const uri = feedUri();
		const path = `/u/${props.uid}/profile/${getRepoId(uri)}/feed/${getRecordId(uri)}`;

		if (isElementAltClicked(ev)) {
			open(path, '_blank');
		} else {
			navigate(path);
		}
	};

	return (
		<div
			ref={sortable.ref}
			tabindex={!editing() ? 0 : undefined}
			onClick={click}
			onAuxClick={click}
			onKeyDown={click}
			class="flex flex-col gap-3 px-4 py-3 text-sm"
			classList={{
				'bg-hinted z-10 touch-none': sortable.isActiveDraggable,
				'cursor-pointer hover:bg-hinted': !editing(),
			}}
			style={transformStyle(sortable.transform)}
		>
			<div class="flex items-center gap-4">
				<Show when={editing()}>
					<button
						class="-my-1.5 -ml-2 flex h-8 w-8 touch-none items-center justify-center text-xl text-muted-fg"
						{...sortable.dragActivators}
					>
						<DragHandleIcon />
					</button>
				</Show>

				<div class="h-6 w-6 overflow-hidden rounded-md bg-muted-fg">
					<Show when={feed()?.avatar.value}>{(avatar) => <img src={avatar()} class="h-full w-full" />}</Show>
				</div>

				<div class="grow">
					<p class="font-bold">{feed()?.displayName.value}</p>
				</div>

				<div class="-mr-2 flex shrink-0 gap-2">
					<button
						title={pinned() ? `Unpin feed` : `Pin feed`}
						onClick={() => props.onPinToggle(feedUri(), !pinned())}
						class="-my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-xl hover:bg-secondary"
						classList={{ 'text-accent': pinned(), 'text-muted-fg': !pinned() }}
					>
						<PushPinIcon />
					</button>

					<Show when={editing()}>
						<button
							title="Remove feed"
							onClick={() => props.onRemove(feedUri())}
							class="-my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-xl text-red-500 hover:bg-secondary"
						>
							<DeleteIcon />
						</button>
					</Show>
				</div>
			</div>
		</div>
	);
};

const AuthenticatedExploreSettingsPage = () => {
	const params = useParams('/u/:uid/settings/explore');

	const uid = () => params.uid as DID;

	const [isEditing, setIsEditing] = createSignal(false);

	const isCoarse = useMediaQuery('(pointer: coarse)');

	const prefs = createMemo(() => {
		return (preferences[uid()] ||= {});
	});

	const pinnedFeeds = createMemo(() => {
		return new Set(prefs().pinnedFeeds);
	});

	const savedFeeds = createMemo(() => {
		return prefs().savedFeeds || [];
	});

	const handleFeedPin = (uri: string, pinned: boolean) => {
		const $prefs = prefs();

		const $savedFeeds = savedFeeds();
		const $pinnedFeeds = pinnedFeeds();

		const set = new Set($pinnedFeeds);

		if (pinned) {
			set.add(uri);
		} else {
			set.delete(uri);
		}

		$prefs.pinnedFeeds = $savedFeeds.filter((uri) => set.has(uri));
	};

	const handleFeedRemove = (uri: string) => {
		let saved = savedFeeds();

		const pinned = new Set(pinnedFeeds());
		const savedIdx = saved.indexOf(uri);

		const $prefs = prefs();

		if (savedIdx !== -1) {
			saved = saved.slice();
			saved.splice(savedIdx, 1);
		}

		pinned.delete(uri);

		batch(() => {
			$prefs.savedFeeds = saved;
			$prefs.pinnedFeeds = saved.filter((uri) => pinned.has(uri));
		});
	};

	return (
		<div class="flex flex-col pb-4">
			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold leading-5">Explore settings</p>
			</div>

			<div class="flex items-center justify-between gap-4 px-4 py-4">
				<p class="text-base font-bold leading-5">Feeds</p>

				<Show when={savedFeeds().length > 0}>
					<button class="text-sm text-accent hover:underline" onClick={() => setIsEditing(!isEditing())}>
						{!isEditing() ? 'Edit' : 'Done'}
					</button>
				</Show>
			</div>

			<DragDropProvider
				onDragEnd={({ draggable, droppable }) => {
					if (draggable && droppable) {
						const $savedFeeds = savedFeeds();

						const fromIndex = $savedFeeds.indexOf(draggable.id as string);
						const toIndex = $savedFeeds.indexOf(droppable.id as string);

						if (fromIndex !== toIndex) {
							const $pinnedFeeds = pinnedFeeds();
							const $prefs = prefs();

							const next = $savedFeeds.slice();
							next.splice(toIndex, 0, ...next.splice(fromIndex, 1));

							batch(() => {
								$prefs.savedFeeds = next;
								$prefs.pinnedFeeds = next.filter((uri) => $pinnedFeeds.has(uri));
							});
						}
					}
				}}
			>
				<DragDropSensors />
				<ConstrainXDragAxis enabled={isCoarse()} />

				<SortableProvider ids={savedFeeds()}>
					<SuspenseList revealOrder="forwards" tail="collapsed">
						<For
							each={savedFeeds()}
							fallback={
								<div class="p-4 pt-2 text-sm text-muted-fg">You don't have any feeds yet, add one!</div>
							}
						>
							{(feedUri) => {
								return (
									<Suspense
										fallback={
											<div class="flex h-13 items-center justify-center border-divider">
												<CircularProgress />
											</div>
										}
									>
										<FeedItem
											uid={uid()}
											uri={feedUri}
											pinned={pinnedFeeds().has(feedUri)}
											editing={isEditing()}
											onPinToggle={handleFeedPin}
											onRemove={handleFeedRemove}
										/>
									</Suspense>
								);
							}}
						</For>
					</SuspenseList>
				</SortableProvider>
			</DragDropProvider>

			<A
				href="/u/:uid/settings/explore/add"
				params={params}
				class="flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted"
			>
				<AddIcon class="text-2xl" />
				<span>Add new feed</span>
			</A>
		</div>
	);
};

export default AuthenticatedExploreSettingsPage;

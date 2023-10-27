import { For, Show, createEffect, createMemo, createSignal } from 'solid-js';

import type { DID } from '@externdefs/bluesky-client/atp-schema';
import { type EnhancedResource, createQuery } from '@intrnl/sq';
import { useNavigate } from '@solidjs/router';
import {
	DragDropProvider,
	DragDropSensors,
	SortableProvider,
	createSortable,
	transformStyle,
} from '@thisbeyond/solid-dnd';

import { getCollectionId, getRecordId, getRepoId } from '~/api/utils.ts';

import { type SignalizedFeedGenerator } from '~/api/cache/feed-generators.ts';
import { type SignalizedList } from '~/api/cache/lists.ts';
import {
	getFeedGenerator,
	getFeedGeneratorKey,
	getInitialFeedGenerator,
} from '~/api/queries/get-feed-generator.ts';
import { getInitialListInfo, getListInfo, getListInfoKey } from '~/api/queries/get-list.ts';

import { getFeedPref, type FeedPreference } from '~/globals/settings.ts';
import { generatePath, useParams } from '~/router.ts';
import { ConstrainXDragAxis } from '~/utils/dnd.ts';
import { useMediaQuery } from '~/utils/media-query.ts';
import { INTERACTION_TAGS, assert, isElementAltClicked, isElementClicked } from '~/utils/misc.ts';
import type { UnpackArray } from '~/utils/types.ts';

import AddIcon from '~/icons/baseline-add.tsx';
import DeleteIcon from '~/icons/baseline-delete.tsx';
import DragHandleIcon from '~/icons/baseline-drag-handle.tsx';
import PushPinIcon from '~/icons/baseline-push-pin.tsx';

type PinToggleHandler = (item: UnpackArray<FeedPreference['feeds']>) => void;
type RemoveHandler = (item: UnpackArray<FeedPreference['feeds']>) => void;

interface FeedItemProps {
	uid: DID;
	item: UnpackArray<FeedPreference['feeds']>;
	editing: boolean;
	onPinToggle: PinToggleHandler;
	onRemove: RemoveHandler;
}

const FeedItem = (props: FeedItemProps) => {
	// `item` and `item.uri` is expected to be static
	const item = props.item;
	const uri = item.uri;

	const actor = getRepoId(uri);
	const collection = getCollectionId(uri);
	const rkey = getRecordId(uri);

	const sortable = createSortable(uri);

	const navigate = useNavigate();

	const pinned = () => item.pinned;
	const editing = () => props.editing;

	let info: EnhancedResource<SignalizedFeedGenerator | SignalizedList>;
	let path: () => string;

	if (collection === 'app.bsky.feed.generator') {
		[info] = createQuery({
			key: () => getFeedGeneratorKey(props.uid, uri),
			fetch: getFeedGenerator,
			staleTime: 30_000,
			initialData: getInitialFeedGenerator,
		});

		path = () => {
			return generatePath('/u/:uid/profile/:actor/feed/:feed', {
				uid: props.uid,
				actor: actor,
				feed: rkey,
			});
		};
	} else if (collection === 'app.bsky.graph.list') {
		[info] = createQuery<SignalizedList, any>({
			key: () => getListInfoKey(props.uid, uri),
			fetch: getListInfo,
			staleTime: 30_000,
			initialData: getInitialListInfo,
		});

		path = () => {
			return generatePath('/u/:uid/profile/:actor/lists/:list', {
				uid: props.uid,
				actor: actor,
				list: rkey,
			});
		};
	} else {
		assert(false, `expected collection`);
	}

	createEffect(() => {
		const $info = info();
		if ($info) {
			item.name = $info.name.value;
		}
	});

	const click = (ev: MouseEvent | KeyboardEvent) => {
		if (editing() || !isElementClicked(ev, INTERACTION_TAGS)) {
			return;
		}

		const $path = path();

		if (isElementAltClicked(ev)) {
			open($path, '_blank');
		} else {
			navigate($path);
		}
	};

	return (
		<div
			ref={sortable.ref}
			tabindex={!editing() ? 0 : undefined}
			onClick={click}
			onAuxClick={click}
			onKeyDown={click}
			class="flex flex-col gap-3 px-4 py-3 text-sm outline-2 -outline-offset-2 outline-primary focus-visible:outline"
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
					<Show when={info()?.avatar.value}>{(avatar) => <img src={avatar()} class="h-full w-full" />}</Show>
				</div>

				<div class="grow">
					<p class="font-bold">{item.name}</p>
				</div>

				<div class="-mr-2 flex shrink-0 gap-2">
					<button
						title={pinned() ? `Unpin feed` : `Pin feed`}
						onClick={() => props.onPinToggle(item)}
						class="-my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-xl hover:bg-secondary"
						classList={{ 'text-accent': pinned(), 'text-muted-fg': !pinned() }}
					>
						<PushPinIcon />
					</button>

					<Show when={editing()}>
						<button
							title="Remove feed"
							onClick={() => props.onRemove(item)}
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

	const savedFeeds = createMemo(() => {
		const prefs = getFeedPref(uid());
		return prefs.feeds;
	});

	const handleFeedPin = (item: UnpackArray<FeedPreference['feeds']>) => {
		item.pinned = !item.pinned;
	};

	const handleFeedRemove = (item: UnpackArray<FeedPreference['feeds']>) => {
		const feeds = savedFeeds();
		const index = feeds.indexOf(item);

		if (index !== -1) {
			feeds.splice(index, 1);
		}
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
						const feeds = savedFeeds();

						const fromIndex = feeds.findIndex((item) => item.uri === draggable.id);
						const toIndex = feeds.findIndex((item) => item.uri === droppable.id);

						if (fromIndex !== toIndex) {
							feeds.splice(toIndex, 0, ...feeds.splice(fromIndex, 1));
						}
					}
				}}
			>
				<DragDropSensors />
				<ConstrainXDragAxis enabled={isCoarse()} />

				<SortableProvider ids={savedFeeds().map((feed) => feed.uri)}>
					<For
						each={savedFeeds()}
						fallback={
							<div class="p-4 pt-2 text-sm text-muted-fg">You don't have any feeds yet, add one!</div>
						}
					>
						{(item) => (
							<FeedItem
								uid={uid()}
								item={item}
								editing={isEditing()}
								onPinToggle={handleFeedPin}
								onRemove={handleFeedRemove}
							/>
						)}
					</For>
				</SortableProvider>
			</DragDropProvider>

			<a
				link
				href={generatePath('/u/:uid/settings/explore/add', params)}
				class="flex items-center gap-4 px-4 py-3 text-sm outline-2  -outline-offset-2 outline-primary hover:bg-hinted focus-visible:outline"
			>
				<AddIcon class="text-2xl" />
				<span>Add new feed</span>
			</a>
		</div>
	);
};

export default AuthenticatedExploreSettingsPage;

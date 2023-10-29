import { For, Match, Switch, createMemo, createSignal, useContext } from 'solid-js';

import type { DID } from '@externdefs/bluesky-client/atp-schema';
import { XRPCError } from '@externdefs/bluesky-client/xrpc-utils';
import { createQuery, useQueryMutation } from '@intrnl/sq';

import {
	type ListMembersPage,
	createListUri,
	getListMembers,
	getListMembersKey,
} from '~/api/queries/get-list.ts';

import { getCollectionCursor, getRecordId, type Collection } from '~/api/utils.ts';

import { multiagent } from '~/globals/agent.ts';
import { openModal } from '~/globals/modals.tsx';
import { useParams } from '~/router.ts';

import ProfileItem, {
	createProfileItemKey,
	type ProfileItemAccessory,
	type ProfileItemProps,
} from '~/components/lists/ProfileItem.tsx';
import CircularProgress from '~/components/CircularProgress.tsx';
import VirtualContainer from '~/components/VirtualContainer.tsx';

import MoreHorizIcon from '~/icons/baseline-more-horiz.tsx';

import { ListDidContext } from '../u.$uid.profile.$actor_.lists.$list/context.tsx';

import ListItemMenu from './ListItemMenu.tsx';

const AuthenticatedListPage = () => {
	const [did] = useContext(ListDidContext)!;

	const params = useParams('/u/:uid/profile/:actor/lists/:list');

	const uid = () => params.uid as DID;

	const [listing, { refetch }] = createQuery({
		key: () => {
			const $did = did();
			if ($did) {
				return getListMembersKey(uid(), createListUri($did, params.list));
			}
		},
		fetch: getListMembers,
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
	});

	const isListOwner = createMemo(() => {
		return uid() === did();
	});

	const flattenedMembers = () => {
		return listing()?.pages.flatMap((page) => page.members);
	};

	return (
		<>
			<For each={flattenedMembers()}>
				{(member) => {
					const { uri, subject, profile } = member;

					if (!profile) {
						return (
							<div class="flex items-center gap-3 px-4 py-3 text-sm">
								<div class="h-12 w-12 shrink-0 rounded-full bg-muted-fg"></div>

								<div class="text-muted-fg">
									<p>This user no longer exists</p>
									<p>{subject}</p>
								</div>
							</div>
						);
					}

					// This is expected to be static, because if `uid` changes we won't
					// even be rendering the list with the same objects.
					if (isListOwner()) {
						return (
							<OwnedListItem
								uid={/* @once */ uid()}
								profile={profile}
								uri={uri}
								listRkey={/* @once */ params.list}
							/>
						);
					}

					return (
						<VirtualContainer id={createProfileItemKey(profile)} estimateHeight={88}>
							<ProfileItem uid={uid()} profile={profile} />
						</VirtualContainer>
					);
				}}
			</For>

			<Switch>
				<Match when={listing.loading}>
					<div class="flex h-13 items-center justify-center border-divider">
						<CircularProgress />
					</div>
				</Match>

				<Match when={listing.error} keyed>
					{(err) => (
						<div class="grid grow place-items-center">
							<div class="max-w-sm p-4">
								<h1 class="mb-1 text-xl font-bold">Failed to load</h1>
								<p class="break-words text-sm">{err instanceof XRPCError ? err.message : '' + err}</p>
							</div>
						</div>
					)}
				</Match>

				<Match when={getCollectionCursor(listing(), 'cursor')}>
					{(cursor) => (
						<button
							onClick={() => refetch(true, cursor())}
							class="flex h-13 items-center justify-center text-sm text-accent hover:bg-hinted disabled:pointer-events-none"
						>
							Show more
						</button>
					)}
				</Match>

				<Match when={!!listing()}>
					<div class="flex h-13 items-center justify-center">
						<p class="text-sm text-muted-fg">End of list</p>
					</div>
				</Match>
			</Switch>
		</>
	);
};

export default AuthenticatedListPage;

interface OwnedListItemProps extends Pick<ProfileItemProps, 'uid' | 'profile'> {
	uri: string;
	listRkey: string;
}

const enum ItemState {
	DEFAULT,
	PENDING,
	DELETED,
}

const OwnedListItem = (props: OwnedListItemProps) => {
	// These are expected to be static.
	const { uid, profile, uri, listRkey } = props;

	const [state, setState] = createSignal(ItemState.DEFAULT);
	const mutate = useQueryMutation();

	const onRemove = async () => {
		if (state() !== ItemState.DEFAULT) {
			return;
		}

		setState(ItemState.PENDING);

		try {
			const agent = await multiagent.connect(uid);

			await agent.rpc.call('com.atproto.repo.deleteRecord', {
				data: {
					repo: uid,
					collection: 'app.bsky.graph.listitem',
					rkey: getRecordId(uri),
				},
			});

			mutate(
				false,
				getListMembersKey(uid, createListUri(uid, listRkey)),
				(prev: Collection<ListMembersPage>): Collection<ListMembersPage> => {
					return {
						...prev,
						pages: prev.pages.map((page) => {
							return {
								...page,
								members: page.members.filter((member) => member.uri !== uri),
							};
						}),
					};
				},
			);
		} catch (_err) {}

		setState(ItemState.DEFAULT);
	};

	const accessory: ProfileItemAccessory = {
		key: '',
		render: () => {
			return (
				<button
					onClick={() => {
						openModal(() => <ListItemMenu onRemove={onRemove} />);
					}}
					class="-mx-2 flex h-8 w-8 items-center justify-center rounded-full text-base text-muted-fg hover:bg-secondary"
				>
					<MoreHorizIcon />
				</button>
			);
		},
	};

	return (
		<VirtualContainer id={createProfileItemKey(profile, accessory)} estimateHeight={88}>
			<div classList={{ 'pointer-events-none opacity-50': state() === ItemState.PENDING }}>
				<ProfileItem uid={uid} profile={profile} aside={accessory} />
			</div>
		</VirtualContainer>
	);
};

import { For, Match, Show, Switch, createEffect } from 'solid-js';

import type { DID } from '@externdefs/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';

import type { SignalizedProfile } from '~/api/cache/profiles.ts';
import type { ProfilesListPage } from '~/api/models/profiles-list.ts';
import {
	getSelfBlocks,
	getSelfBlocksKey,
	getSelfBlocksLatest,
	getSelfBlocksLatestKey,
} from '~/api/queries/get-self-blocks.ts';

import { getCollectionCursor } from '~/api/utils.ts';

import { openModal } from '~/globals/modals.tsx';
import { useParams } from '~/router.ts';
import { Title } from '~/utils/meta.tsx';

import BlockConfirmDialog from '~/components/dialogs/BlockConfirmDialog.tsx';
import ProfileItem, {
	createProfileItemKey,
	type ProfileItemAccessory,
} from '~/components/lists/ProfileItem.tsx';
import CircularProgress from '~/components/CircularProgress.tsx';
import VirtualContainer from '~/components/VirtualContainer.tsx';
import button from '~/styles/primitives/button.ts';

const ProfileBlockedAccessory: ProfileItemAccessory = {
	key: '',
	render: (profile, uid) => {
		const isBlocked = () => profile.viewer.blocking.value;

		return (
			<button
				onClick={() => {
					openModal(() => <BlockConfirmDialog uid={uid} profile={profile} />);
				}}
				class={button({ color: isBlocked() ? 'danger' : 'outline' })}
			>
				{isBlocked() ? 'Blocked' : 'Block'}
			</button>
		);
	},
};

const AuthenticatedBlockedUsersModerationPage = () => {
	const params = useParams('/u/:uid/you/moderation/muted');

	const uid = () => params.uid as DID;

	const [blocks, { refetch }] = createQuery({
		key: () => getSelfBlocksKey(uid(), 30),
		fetch: getSelfBlocks,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	const getProfileListDid = ($blocks: ReturnType<typeof blocks>) => {
		let $pages: ProfilesListPage[];
		let $profiles: SignalizedProfile[];

		return (
			!!$blocks &&
			($pages = $blocks.pages).length > 0 &&
			($profiles = $pages[0].profiles).length > 0 &&
			$profiles[0].did
		);
	};

	const [latest, { mutate: mutateLatest }] = createQuery({
		key: () => {
			if (getProfileListDid(blocks())) {
				return getSelfBlocksLatestKey(uid());
			}
		},
		fetch: getSelfBlocksLatest,
		staleTime: 10_000,
	});

	createEffect((prev: ReturnType<typeof blocks> | 0) => {
		const next = blocks();

		if (prev !== 0 && next) {
			const pages = next.pages;

			if (pages.length === 1) {
				const did = getProfileListDid(next);
				mutateLatest({ did: did || undefined });
			}
		}

		return next;
	}, 0 as const);

	return (
		<div class="flex flex-col">
			<Title render={`Blocked users / Langit`} />

			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Blocked users</p>
			</div>

			<Switch>
				<Match when={blocks.loading && !blocks.refetchParam}>
					<div
						class="flex h-13 items-center justify-center border-divider"
						classList={{ 'border-b': !!blocks() }}
					>
						<CircularProgress />
					</div>
				</Match>

				<Match
					when={(() => {
						const $latest = latest?.();
						return $latest && $latest.did !== getProfileListDid(blocks());
					})()}
				>
					<button
						onClick={() => refetch(true)}
						class="flex h-13 items-center justify-center border-b border-divider text-sm text-accent hover:bg-hinted"
					>
						Show new blocks
					</button>
				</Match>
			</Switch>

			<For each={blocks()?.pages}>
				{(page) => {
					return page.profiles.map((profile) => {
						return (
							<VirtualContainer
								id={createProfileItemKey(profile, ProfileBlockedAccessory)}
								estimateHeight={88}
							>
								<ProfileItem uid={uid()} profile={profile} aside={ProfileBlockedAccessory} />
							</VirtualContainer>
						);
					});
				}}
			</For>

			<Switch>
				<Match when={blocks.loading && blocks.refetchParam}>
					<div class="flex h-13 items-center justify-center border-divider">
						<CircularProgress />
					</div>
				</Match>

				<Match when={blocks.error}>
					<Show when={!blocks.loading}>
						<div class="flex flex-col items-center px-4 py-6 text-sm text-muted-fg">
							<p>Something went wrong</p>
							<p class="mb-4">{'' + blocks.error}</p>

							<button
								onClick={() => {
									const param = blocks.refetchParam;
									refetch(true, param);
								}}
								class={/* @once */ button({ color: 'primary' })}
							>
								Reload
							</button>
						</div>
					</Show>
				</Match>

				<Match when={getCollectionCursor(blocks(), 'cursor')}>
					{(cursor) => (
						<button
							onClick={() => refetch(true, cursor())}
							disabled={blocks.loading}
							class="flex h-13 items-center justify-center text-sm text-accent hover:bg-hinted disabled:pointer-events-none"
						>
							Show more
						</button>
					)}
				</Match>

				<Match when={!blocks.loading}>
					<div class="flex h-13 items-center justify-center">
						<p class="text-sm text-muted-fg">End of list</p>
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default AuthenticatedBlockedUsersModerationPage;

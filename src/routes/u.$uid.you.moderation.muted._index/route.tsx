import { For, Match, Show, Switch, createEffect } from 'solid-js';

import type { DID } from '@externdefs/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';

import type { SignalizedProfile } from '~/api/cache/profiles.ts';
import type { ProfilesListPage } from '~/api/models/profiles-list.ts';
import {
	getSelfMutes,
	getSelfMutesKey,
	getSelfMutesLatest,
	getSelfMutesLatestKey,
} from '~/api/queries/get-self-mutes.ts';

import { getCollectionCursor } from '~/api/utils.ts';

import { openModal } from '~/globals/modals.tsx';
import { useParams } from '~/router.ts';
import { Title } from '~/utils/meta.tsx';

import MuteConfirmDialog from '~/components/dialogs/MuteConfirmDialog.tsx';
import ProfileItem, {
	createProfileItemKey,
	type ProfileItemAccessory,
} from '~/components/lists/ProfileItem.tsx';
import CircularProgress from '~/components/CircularProgress.tsx';
import VirtualContainer from '~/components/VirtualContainer.tsx';
import button from '~/styles/primitives/button.ts';

import VolumeOffIcon from '~/icons/baseline-volume-off.tsx';
import VolumeUpIcon from '~/icons/baseline-volume-up.tsx';

const MuteAccessory: ProfileItemAccessory = {
	key: '',
	render: (profile, uid) => {
		const isMuted = () => profile.viewer.muted.value;

		return (
			<button
				onClick={() => {
					openModal(() => <MuteConfirmDialog uid={uid} profile={profile} />);
				}}
				class="group flex h-9 w-9 items-center justify-center rounded-full border"
				classList={{
					'is-active border-red-900 hover:bg-red-600/20': isMuted(),
					'border-input hover:bg-secondary': !isMuted(),
				}}
			>
				<VolumeUpIcon class="text-xl text-accent group-[.is-active]:hidden" />
				<VolumeOffIcon class="hidden text-xl text-red-500 group-[.is-active]:block" />
			</button>
		);
	},
};

const AuthenticatedMutedUsersModerationPage = () => {
	const params = useParams('/u/:uid/you/moderation/muted');

	const uid = () => params.uid as DID;

	const [mutes, { refetch }] = createQuery({
		key: () => getSelfMutesKey(uid(), 30),
		fetch: getSelfMutes,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	const getProfileListDid = ($mutes: ReturnType<typeof mutes>) => {
		let $pages: ProfilesListPage[];
		let $profiles: SignalizedProfile[];

		return (
			!!$mutes &&
			($pages = $mutes.pages).length > 0 &&
			($profiles = $pages[0].profiles).length > 0 &&
			$profiles[0].did
		);
	};

	const [latest, { mutate: mutateLatest }] = createQuery({
		key: () => {
			if (getProfileListDid(mutes())) {
				return getSelfMutesLatestKey(uid());
			}
		},
		fetch: getSelfMutesLatest,
		staleTime: 10_000,
	});

	createEffect((prev: ReturnType<typeof mutes> | 0) => {
		const next = mutes();

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
			<Title render={`Muted users / Langit`} />

			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Muted users</p>
			</div>

			<Switch>
				<Match when={mutes.loading && !mutes.refetchParam}>
					<div
						class="flex h-13 items-center justify-center border-divider"
						classList={{ 'border-b': !!mutes() }}
					>
						<CircularProgress />
					</div>
				</Match>

				<Match
					when={(() => {
						const $latest = latest?.();
						return $latest && $latest.did !== getProfileListDid(mutes());
					})()}
				>
					<button
						onClick={() => refetch(true)}
						class="flex h-13 items-center justify-center border-b border-divider text-sm text-accent hover:bg-hinted"
					>
						Show new mutes
					</button>
				</Match>
			</Switch>

			<For each={mutes()?.pages}>
				{(page) => {
					return page.profiles.map((profile) => {
						return (
							<VirtualContainer id={createProfileItemKey(profile)} estimateHeight={88}>
								<ProfileItem uid={uid()} profile={profile} aside={MuteAccessory} />
							</VirtualContainer>
						);
					});
				}}
			</For>

			<Switch>
				<Match when={mutes.loading && mutes.refetchParam}>
					<div class="flex h-13 items-center justify-center border-divider">
						<CircularProgress />
					</div>
				</Match>

				<Match when={mutes.error}>
					<Show when={!mutes.loading}>
						<div class="flex flex-col items-center px-4 py-6 text-sm text-muted-fg">
							<p>Something went wrong</p>
							<p class="mb-4">{'' + mutes.error}</p>

							<button
								onClick={() => {
									const param = mutes.refetchParam;
									refetch(true, param);
								}}
								class={/* @once */ button({ color: 'primary' })}
							>
								Reload
							</button>
						</div>
					</Show>
				</Match>

				<Match when={getCollectionCursor(mutes(), 'cursor')}>
					{(cursor) => (
						<button
							onClick={() => refetch(true, cursor())}
							disabled={mutes.loading}
							class="flex h-13 items-center justify-center text-sm text-accent hover:bg-hinted disabled:pointer-events-none"
						>
							Show more
						</button>
					)}
				</Match>

				<Match when={!mutes.loading}>
					<div class="flex h-13 items-center justify-center">
						<p class="text-sm text-muted-fg">End of list</p>
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default AuthenticatedMutedUsersModerationPage;

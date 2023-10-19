import { For, Match, Show, Switch, createEffect } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';
import { useNavigate } from '@solidjs/router';

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
import { generatePath, useParams } from '~/router.ts';
import { Title } from '~/utils/meta.tsx';
import { INTERACTION_TAGS, isElementAltClicked, isElementClicked } from '~/utils/misc.ts';

import MuteConfirmDialog from '~/components/dialogs/MuteConfirmDialog.tsx';
import CircularProgress from '~/components/CircularProgress.tsx';
import VirtualContainer from '~/components/VirtualContainer.tsx';
import button from '~/styles/primitives/button.ts';

import VolumeOffIcon from '~/icons/baseline-volume-off.tsx';
import VolumeUpIcon from '~/icons/baseline-volume-up.tsx';

const AuthenticatedMutedUsersModerationPage = () => {
	const params = useParams('/u/:uid/you/moderation/muted');
	const navigate = useNavigate();

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
						const isMuted = () => profile.viewer.muted.value;

						const handleClick = (ev: MouseEvent | KeyboardEvent) => {
							if (!isElementClicked(ev, INTERACTION_TAGS)) {
								return;
							}

							const path = generatePath('/u/:uid/profile/:actor', {
								uid: uid(),
								actor: profile.did,
							});

							if (isElementAltClicked(ev)) {
								open(path, '_blank');
							} else {
								navigate(path);
							}
						};

						return (
							<VirtualContainer id={/* @once */ `profile/${profile.did}/m`} estimateHeight={88}>
								<div
									onClick={handleClick}
									onAuxClick={handleClick}
									onKeyDown={handleClick}
									role="button"
									tabindex={0}
									class="flex gap-3 px-4 py-3 hover:bg-hinted"
								>
									<div class="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted-fg">
										<Show when={profile.avatar.value}>
											{(avatar) => <img src={avatar()} class="h-full w-full" />}
										</Show>
									</div>

									<div class="flex min-w-0 grow flex-col gap-1">
										<div class="flex items-center justify-between gap-3">
											<div class="flex flex-col text-sm">
												<span dir="auto" class="line-clamp-1 break-all font-bold">
													{profile.displayName.value || profile.handle.value}
												</span>
												<span class="line-clamp-1 break-all text-muted-fg">@{profile.handle.value}</span>
											</div>

											<div>
												<button
													onClick={() => {
														openModal(() => <MuteConfirmDialog uid={uid()} profile={profile} />);
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
											</div>
										</div>

										<Show when={profile.description.value}>
											<div class="line-clamp-3 break-words text-sm">{profile.$renderedDescription()}</div>
										</Show>
									</div>
								</div>
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

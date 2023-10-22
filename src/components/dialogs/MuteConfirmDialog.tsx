import { Match, Switch, batch, createSignal } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery, useQueryMutation } from '@intrnl/sq';

import { produce, setAutoFreeze } from 'immer';

import { type Collection } from '~/api/utils.ts';

import type { SignalizedProfile } from '~/api/cache/profiles.ts';
import type { TimelineSlice } from '~/api/models/timeline.ts';
import { muteProfile } from '~/api/mutations/mute-profile.ts';
import { getListInfo, getListInfoKey } from '~/api/queries/get-list.ts';
import type { FeedPage } from '~/api/queries/get-timeline.ts';

import { closeModal } from '~/globals/modals.tsx';
import { getFilterPref, isProfileTemporarilyMuted } from '~/globals/settings.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import ListItem from '~/components/ListItem.tsx';
import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';
import select from '~/styles/primitives/select.ts';

export interface MuteConfirmDialogProps {
	uid: DID;
	profile: SignalizedProfile;
}

setAutoFreeze(false);

const MuteConfirmDialog = (props: MuteConfirmDialogProps) => {
	const uid = () => props.uid;
	const profile = () => props.profile;

	const [duration, setDuration] = createSignal('-1');
	const mutate = useQueryMutation();

	const isTemporarilyMuted = () => isProfileTemporarilyMuted(uid(), profile().did);
	const isMuted = () => profile().viewer.muted.value || isTemporarilyMuted();

	const handleMute = () => {
		const $uid = uid();
		const $did = profile().did;

		if (isMuted()) {
			if (isTemporarilyMuted()) {
				const prefs = getFilterPref($uid);
				const mutes = prefs.tempMutes;

				if (mutes) {
					delete mutes[$did];
				}
			} else {
				muteProfile($uid, profile());
			}

			closeModal();
			return;
		}

		const parsedDuration = parseInt(duration());

		const isSliceMatching = (slice: TimelineSlice) => {
			const items = slice.items;

			for (let k = items.length - 1; k >= 0; k--) {
				const item = items[k];

				if (item.reason?.by.did === $did || item.post.author.did === $did) {
					return true;
				}
			}
		};

		const updateFeed = produce((data: Collection<FeedPage>) => {
			const pages = data.pages;

			for (let i = 0, il = pages.length; i < il; i++) {
				const page = pages[i];

				const slices = page.slices;
				const remainingSlices = page.remainingSlices;

				for (let j = slices.length - 1; j >= 0; j--) {
					const slice = slices[j];

					if (isSliceMatching(slice)) {
						slices.splice(j, 1);
					}
				}

				for (let j = remainingSlices.length - 1; j >= 0; j--) {
					const slice = remainingSlices[j];

					if (isSliceMatching(slice)) {
						remainingSlices.splice(j, 1);
					}
				}
			}
		});

		const filterQueryKey = ([t, u, p]: any): boolean => {
			return t === 'getFeed' && u === $uid && (p.type !== 'profile' || p.actor !== $did);
		};

		if (Number.isNaN(parsedDuration) || parsedDuration < 0) {
			muteProfile(uid(), profile());
		} else {
			const date = Date.now() + parsedDuration;

			batch(() => {
				const prefs = getFilterPref(uid());
				const mutes = prefs.tempMutes;

				mutes[$did] = date;
			});
		}

		mutate(false, filterQueryKey, updateFeed);
		closeModal();
	};

	return (
		<div class={/* @once */ dialog.content()}>
			<Switch>
				<Match when={profile().viewer.mutedByList.value}>
					{(record) => {
						const [list] = createQuery({
							key: () => getListInfoKey(uid(), record().uri),
							fetch: getListInfo,
							staleTime: 60_000,
							refetchOnReconnect: false,
							refetchOnWindowFocus: false,
						});

						return (
							<>
								<h1 class={/* @once */ dialog.title()}>Cannot unmute this user</h1>

								<p class="mt-3 text-sm">
									We can't unmute <strong>@{profile().handle.value}</strong> because you've chosen to mute
									users on this list:
								</p>

								<div class="mt-3 rounded-md border border-divider">
									<Switch>
										<Match when={list()}>
											{(data) => (
												<ListItem uid={uid()} list={data()} hideSubscribedBadge onClick={closeModal} />
											)}
										</Match>

										<Match when>
											<div class="flex justify-center p-3">
												<CircularProgress />
											</div>
										</Match>
									</Switch>
								</div>

								<div class={/* @once */ dialog.actions()}>
									<button onClick={closeModal} class={/* @once */ button({ color: 'primary' })}>
										Dismiss
									</button>
								</div>
							</>
						);
					}}
				</Match>

				<Match when>
					<h1 class={/* @once */ dialog.title()}>
						{isMuted() ? 'Unmute' : 'Mute'} @{profile().handle.value}?
					</h1>

					{isMuted() ? (
						<p class="mt-3 text-sm">Their posts will be allowed to show in your home timeline</p>
					) : (
						<div>
							<p class="mt-3 text-sm">
								Their posts will no longer show up in your home timeline, but it will still allow them to see
								your posts and follow you.
							</p>

							<div class="mt-3 text-sm">
								<label>
									<span class="mr-4">Duration:</span>
									<select
										value={duration()}
										onChange={(el) => setDuration(el.currentTarget.value)}
										class={/* @once */ select()}
									>
										<option value={-1}>Indefinite</option>
										<option value={1 * 60 * 60 * 1_000}>1 hour</option>
										<option value={6 * 60 * 60 * 1_000}>6 hour</option>
										<option value={12 * 60 * 60 * 1_000}>12 hour</option>
										<option value={1 * 24 * 60 * 60 * 1_000}>1 day</option>
										<option value={3 * 24 * 60 * 60 * 1_000}>3 days</option>
										<option value={7 * 24 * 60 * 60 * 1_000}>7 days</option>
										<option value={14 * 24 * 60 * 60 * 1_000}>14 days</option>
									</select>
								</label>
							</div>
						</div>
					)}

					<div class={/* @once */ dialog.actions()}>
						<button onClick={closeModal} class={/* @once */ button({ color: 'ghost' })}>
							Cancel
						</button>
						<button onClick={handleMute} class={/* @once */ button({ color: 'primary' })}>
							{isMuted() ? 'Unmute' : 'Mute'}
						</button>
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default MuteConfirmDialog;

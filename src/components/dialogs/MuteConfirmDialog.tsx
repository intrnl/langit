import { Match, Switch, batch, createSignal } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { createQuery, useQueryMutation } from '@intrnl/sq';

import { produce, setAutoFreeze } from 'immer';

import { getRecordId, getRepoId, type Collection } from '~/api/utils.ts';

import type { SignalizedProfile } from '~/api/cache/profiles.ts';
import { muteProfile } from '~/api/mutations/mute-profile.ts';
import { getList, getListKey } from '~/api/queries/get-list.ts';
import type { FeedPage } from '~/api/queries/get-timeline.ts';

import { closeModal } from '~/globals/modals.tsx';
import { preferences } from '~/globals/preferences';

import CircularProgress from '~/components/CircularProgress.tsx';
import ListItem from '~/components/ListItem.tsx';
import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';
import type { TimelineSlice } from '~/api/models/timeline';

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

	const isMuted = () => profile().viewer.muted.value;

	return (
		<div class={/* @once */ dialog.content()}>
			<Switch>
				<Match when={profile().viewer.mutedByList.value}>
					{(record) => {
						const [list] = createQuery({
							key: () => getListKey(uid(), getRepoId(record().uri), getRecordId(record().uri), 1),
							fetch: getList,
							staleTime: 60_000,
							refetchOnReconnect: false,
							refetchOnWindowFocus: false,
						});

						return (
							<>
								<h1 class={/* @once */ dialog.title()}>Cannot unmute @{profile().handle.value}</h1>

								<p class="mt-3 text-sm">To unmute this user, you have to unsubscribe from this mute list.</p>

								<div class="mt-3 rounded-md border border-divider">
									<Switch>
										<Match when={list()?.pages[0]}>
											{(data) => (
												<ListItem
													uid={uid()}
													list={data().list}
													hideSubscribedBadge
													onClick={() => {
														closeModal();
													}}
												/>
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
									<button
										onClick={() => {
											closeModal();
										}}
										class={/* @once */ button({ color: 'primary' })}
									>
										Ok
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
										class="rounded-md border border-input bg-background px-3 py-2 text-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
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
						<button
							onClick={() => {
								closeModal();
							}}
							class={/* @once */ button({ color: 'ghost' })}
						>
							Cancel
						</button>
						<button
							onClick={() => {
								const parsedDuration = parseInt(duration());

								if (Number.isNaN(parsedDuration) || parsedDuration < 0) {
									muteProfile(uid(), profile());
									closeModal();
								} else {
									const $did = profile().did;

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

									const date = Date.now() + parsedDuration;

									batch(() => {
										const accountPref = (preferences[uid()] ||= {});
										const tempMutes = (accountPref.pf_tempMutes ||= {});

										tempMutes[profile().did] = date;
									});

									mutate(false, ['getFeed', uid()], updateFeed);
									closeModal();
								}
							}}
							class={/* @once */ button({ color: 'primary' })}
						>
							{isMuted() ? 'Unmute' : 'Mute'}
						</button>
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default MuteConfirmDialog;

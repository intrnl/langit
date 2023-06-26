import { Match, Switch } from 'solid-js';

import { createQuery } from '~/lib/solid-query/index.ts';

import { type DID, getRecordId, getRepoId } from '~/api/utils.ts';

import { type SignalizedProfile } from '~/api/cache/profiles.ts';
import { muteProfile } from '~/api/mutations/mute-profile.ts';
import { getList, getListKey } from '~/api/queries/get-list.ts';

import { closeModal } from '~/globals/modals.tsx';

import CircularProgress from '~/components/CircularProgress.tsx';
import ListItem from '~/components/ListItem.tsx';
import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';

export interface MuteConfirmDialogProps {
	uid: DID;
	profile: SignalizedProfile;
}

const MuteConfirmDialog = (props: MuteConfirmDialogProps) => {
	const uid = () => props.uid;
	const profile = () => props.profile;

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
						<p class="mt-3 text-sm">
							Their posts will no longer show up in your home timeline, but it will still allow them to see
							your posts and follow you.
						</p>
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
								muteProfile(uid(), profile());
								closeModal();
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

import { For, Show, Suspense, SuspenseList, createMemo } from 'solid-js';

import type { DID } from '@externdefs/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';

import { mergeSignalizedProfile, type SignalizedProfile } from '~/api/cache/profiles.ts';
import { getInitialProfile, getProfileKey } from '~/api/queries/get-profile.ts';
import { fetchProfileBatched } from '~/api/queries/get-profile-batched.ts';

import { getFilterPref } from '~/globals/settings.ts';
import { useParams } from '~/router.ts';
import { Title } from '~/utils/meta.tsx';
import * as relformat from '~/utils/intl/relformatter.ts';

import ProfileItem, {
	createProfileItemKey,
	type ProfileItemAccessory,
} from '~/components/lists/ProfileItem.tsx';
import CircularProgress from '~/components/CircularProgress.tsx';
import VirtualContainer from '~/components/VirtualContainer.tsx';

const AuthenticatedTempMutedUsersModerationPage = () => {
	const params = useParams('/u/:uid/you/moderation/muted/temp');

	const uid = () => params.uid as DID;

	const mutedUsersDict = createMemo(() => {
		const prefs = getFilterPref(uid());
		const tempMutes = prefs.tempMutes;

		return tempMutes;
	});

	const users = createMemo(() => {
		const dict = mutedUsersDict();

		const now = Date.now();
		const arr: DID[] = [];

		for (const did in dict) {
			const val = dict[did as DID];

			if (val != null && now < val) {
				arr.push(did as DID);
			}
		}

		return arr;
	});

	const TempMuteAccessory: ProfileItemAccessory = {
		key: 'tm',
		render: (profile) => {
			const date = () => mutedUsersDict()[profile.did]!;

			return (
				<p class="text-sm text-muted-fg">
					Muted until <span class="font-bold">{relformat.formatAbsWithTime(date())}</span>
				</p>
			);
		},
	};

	return (
		<div class="flex flex-col">
			<Title render={`Temporarily muted users / Langit`} />

			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Temporarily muted users</p>
			</div>

			<SuspenseList revealOrder="forwards" tail="collapsed">
				<For
					each={users()}
					fallback={<div class="p-4 text-sm text-muted-fg">You don't have any temporarily muted users</div>}
				>
					{(actor) => {
						const [profile] = createQuery<SignalizedProfile, ReturnType<typeof getProfileKey>>({
							key: () => getProfileKey(uid(), actor),
							fetch: async ([, uid, actor]) => {
								const response = await fetchProfileBatched([uid, actor as DID]);
								const profile = mergeSignalizedProfile(uid, response);

								return profile;
							},
							initialData: getInitialProfile,
							refetchOnMount: false,
							refetchOnReconnect: false,
							refetchOnWindowFocus: false,
						});

						return (
							<Suspense
								fallback={
									<div class="flex h-13 items-center justify-center border-divider">
										<CircularProgress />
									</div>
								}
							>
								<Show when={profile()} keyed>
									{(profile) => (
										<VirtualContainer
											id={createProfileItemKey(profile, undefined, TempMuteAccessory)}
											estimateHeight={88}
										>
											<ProfileItem uid={uid()} profile={profile} footer={TempMuteAccessory} />
										</VirtualContainer>
									)}
								</Show>
							</Suspense>
						);
					}}
				</For>

				<Show when={users().length > 0}>
					<Suspense>
						<div class="flex h-13 items-center justify-center">
							<p class="text-sm text-muted-fg">End of list</p>
						</div>
					</Suspense>
				</Show>
			</SuspenseList>
		</div>
	);
};

export default AuthenticatedTempMutedUsersModerationPage;

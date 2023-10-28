import { For, Show, Suspense, SuspenseList, createMemo } from 'solid-js';

import type { DID } from '@externdefs/bluesky-client/atp-schema';
import { createQuery } from '@intrnl/sq';

import { mergeSignalizedProfile, type SignalizedProfile } from '~/api/cache/profiles.ts';
import { getInitialProfile, getProfileKey } from '~/api/queries/get-profile.ts';
import { fetchProfileBatched } from '~/api/queries/get-profile-batched.ts';

import { getFilterPref } from '~/globals/settings.ts';
import { useParams } from '~/router.ts';
import { Title } from '~/utils/meta.tsx';

import ProfileItem, { createProfileItemKey } from '~/components/lists/ProfileItem.tsx';
import CircularProgress from '~/components/CircularProgress.tsx';
import VirtualContainer from '~/components/VirtualContainer.tsx';

const AuthenticatedRepostFilterModerationPage = () => {
	const params = useParams('/u/:uid/you/moderation/muted/temp');

	const uid = () => params.uid as DID;

	const users = createMemo(() => {
		const prefs = getFilterPref(uid());
		return prefs.hideReposts;
	});

	return (
		<div class="flex flex-col">
			<Title render={`Hidden reposts / Langit`} />

			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Hidden reposts</p>
			</div>

			<SuspenseList revealOrder="forwards" tail="collapsed">
				<For
					each={users()}
					fallback={
						<div class="p-4 text-sm text-muted-fg">
							You don't have any users with reposts hidden from timeline
						</div>
					}
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
										<VirtualContainer id={createProfileItemKey(profile)} estimateHeight={88}>
											<ProfileItem uid={uid()} profile={profile} />
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

export default AuthenticatedRepostFilterModerationPage;

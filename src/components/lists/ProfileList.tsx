import { For, Match, Switch } from 'solid-js';

import type { DID } from '@externdefs/bluesky-client/atp-schema';
import type { EnhancedResource } from '@intrnl/sq';

import type { ProfilesListPage } from '~/api/models/profiles-list.ts';
import { type Collection, getCollectionCursor } from '~/api/utils.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import VirtualContainer from '~/components/VirtualContainer.tsx';

import ProfileItem, { type ProfileItemAccessory, createProfileItemKey } from './ProfileItem.tsx';

export interface ProfileListProps {
	uid: DID;
	list: EnhancedResource<Collection<ProfilesListPage>, string>;
	accessory?: ProfileItemAccessory;
	onLoadMore: (cursor: string) => void;
}

const ProfileList = (props: ProfileListProps) => {
	// we're destructuring these props because we don't expect these to ever
	// change, they shouldn't.
	const { list, accessory, onLoadMore } = props;

	return (
		<>
			<For each={list()?.pages}>
				{(page) => {
					return page.profiles.map((profile) => {
						return (
							<VirtualContainer id={createProfileItemKey(profile, accessory)} estimateHeight={112}>
								<ProfileItem uid={props.uid} profile={profile} accessory={accessory} />
							</VirtualContainer>
						);
					});
				}}
			</For>

			<Switch>
				<Match when={list.loading}>
					<div class="flex h-13 items-center justify-center border-divider">
						<CircularProgress />
					</div>
				</Match>

				<Match when={getCollectionCursor(list(), 'cursor')}>
					{(cursor) => (
						<button
							onClick={() => onLoadMore(cursor())}
							disabled={list.loading}
							class="flex h-13 items-center justify-center text-sm text-accent hover:bg-hinted disabled:pointer-events-none"
						>
							Show more
						</button>
					)}
				</Match>

				<Match when={!list.loading}>
					<div class="flex h-13 items-center justify-center">
						<p class="text-sm text-muted-fg">End of list</p>
					</div>
				</Match>
			</Switch>
		</>
	);
};

export default ProfileList;

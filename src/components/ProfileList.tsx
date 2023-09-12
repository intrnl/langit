import { For, Match, Show, Switch } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import type { EnhancedResource } from '@intrnl/sq';
import { useNavigate } from '@solidjs/router';

import type { ProfilesListPage } from '~/api/models/profiles-list.ts';
import { type Collection, getCollectionCursor } from '~/api/utils.ts';

import { generatePath } from '~/router.ts';
import { INTERACTION_TAGS, isElementAltClicked, isElementClicked } from '~/utils/misc.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import FollowButton from '~/components/FollowButton.tsx';
import VirtualContainer from '~/components/VirtualContainer.tsx';

export interface ProfileListProps {
	uid: DID;
	list: EnhancedResource<Collection<ProfilesListPage>, string>;
	hideFollow?: boolean;
	onLoadMore: (cursor: string) => void;
}

const ProfileList = (props: ProfileListProps) => {
	// we're destructuring these props because we don't expect these to ever
	// change, they shouldn't.
	const { list, onLoadMore } = props;

	const navigate = useNavigate();

	const uid = () => props.uid;

	return (
		<>
			<For each={list()?.pages}>
				{(page) => {
					return page.profiles.map((profile) => {
						const showFollowButton = () => !props.hideFollow && profile.did !== uid();

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
							<VirtualContainer
								id={`profile/${profile.did}/${+showFollowButton()}`}
								estimateHeight={112}
							>
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
												<Show when={showFollowButton()}>
													<FollowButton uid={uid()} profile={profile} />
												</Show>
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

import { For, Match, Show, Switch } from 'solid-js';

import { useNavigate } from '@solidjs/router';
import { type CreateInfiniteQueryResult } from '@tanstack/solid-query';

import { type PostProfilesListPage } from '~/api/models/profiles-list.ts';
import { type DID } from '~/api/utils.ts';

import { isElementAltClicked, isElementClicked } from '~/utils/misc.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import FollowButton from '~/components/FollowButton.tsx';
import VirtualContainer from '~/components/VirtualContainer.tsx';

export interface ProfileListProps {
	uid: DID;
	listQuery: CreateInfiniteQueryResult<PostProfilesListPage, unknown>;
	onLoadMore?: () => void;
}

const ProfileList = (props: ProfileListProps) => {
	// we're destructuring these props because we don't expect these to ever
	// change, they shouldn't.
	const { listQuery, onLoadMore } = props;

	const navigate = useNavigate();

	const uid = () => props.uid;

	return (
		<>
			<For each={listQuery.data ? listQuery.data.pages : []}>
				{(page) => {
					return page.profiles.map((profile) => {
						const isFollowing = () => profile.viewer.following.value;

						const handleClick = (ev: MouseEvent | KeyboardEvent) => {
							if (!isElementClicked(ev)) {
								return;
							}

							const path = `/u/${uid()}/profile/${profile.did}`;

							if (isElementAltClicked(ev)) {
								open(path, '_blank');
							} else {
								navigate(path);
							}
						};

						return (
							<VirtualContainer key="profile" id={profile.did}>
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
												<span class="line-clamp-1 break-all font-bold">
													{profile.displayName.value || profile.handle.value}
												</span>
												<span class="line-clamp-1 break-all text-muted-fg">@{profile.handle.value}</span>
											</div>

											<div>
												<Show when={profile.did !== uid()}>
													<FollowButton uid={uid()} profile={profile} />
												</Show>
											</div>
										</div>

										<Show when={profile.description.value}>
											<div class="line-clamp-3 break-words text-sm">
												{profile.$renderedDescription(uid())}
											</div>
										</Show>
									</div>
								</div>
							</VirtualContainer>
						);
					});
				}}
			</For>

			<Switch>
				<Match when={listQuery.isFetching}>
					<div class="flex h-13 items-center justify-center border-divider">
						<CircularProgress />
					</div>
				</Match>

				<Match when={listQuery.hasNextPage}>
					<button
						onClick={onLoadMore}
						disabled={listQuery.isRefetching}
						class="flex h-13 items-center justify-center text-sm text-accent hover:bg-hinted disabled:pointer-events-none"
					>
						Show more
					</button>
				</Match>
			</Switch>
		</>
	);
};

export default ProfileList;

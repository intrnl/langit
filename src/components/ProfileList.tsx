import { For, Match, Show, Switch } from 'solid-js';

import { useNavigate } from '@solidjs/router';
import { type CreateInfiniteQueryResult } from '@tanstack/solid-query';

import { type ProfilesListPage } from '~/api/models/profiles-list.ts';
import { type DID } from '~/api/utils.ts';

import { followProfile } from '~/api/mutations/follow-profile.ts';

import { isElementAltClicked, isElementClicked } from '~/utils/misc.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import VirtualContainer from '~/components/VirtualContainer.tsx';
import button from '~/styles/primitives/button.ts';

export interface ProfileListProps {
	uid: DID;
	listQuery: CreateInfiniteQueryResult<ProfilesListPage, unknown>;
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
							}
							else {
								navigate(path);
							}
						};

						return (
							<VirtualContainer key='profile' id={profile.did}>
								<div
									onClick={handleClick}
									onAuxClick={handleClick}
									onKeyDown={handleClick}
									role='button'
									tabindex={0}
									class='px-4 py-3 flex gap-3 hover:bg-hinted'
								>
									<div class='h-12 w-12 shrink-0 rounded-full bg-hinted-fg overflow-hidden'>
										<Show when={profile.avatar.value}>
											{(avatar) => <img src={avatar()} class='h-full w-full' />}
										</Show>
									</div>

									<div class='grow flex flex-col gap-1 min-w-0'>
										<div class='flex items-center justify-between gap-3'>
											<div class='flex flex-col text-sm'>
												<span class='font-bold break-all whitespace-pre-wrap break-words line-clamp-1'>
													{profile.displayName.value || profile.handle.value}
												</span>
												<span class='text-muted-fg break-all whitespace-pre-wrap line-clamp-1'>
													@{profile.handle.value}
												</span>
											</div>

											<div>
												<button
													onClick={() => followProfile(uid(), profile)}
													class={button({ color: isFollowing() ? 'outline' : 'primary' })}
												>
													{isFollowing() ? 'Following' : 'Follow'}
												</button>
											</div>
										</div>

										<Show when={profile.description.value}>
											<div class='text-sm break-words line-clamp-3'>
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
					<div class='h-13 flex items-center justify-center border-divider'>
						<CircularProgress />
					</div>
				</Match>

				<Match when={listQuery.hasNextPage}>
					<button
						onClick={onLoadMore}
						disabled={listQuery.isRefetching}
						class='text-sm text-accent flex items-center justify-center h-13 hover:bg-hinted disabled:pointer-events-none'
					>
						Show more
					</button>
				</Match>
			</Switch>
		</>
	);
};

export default ProfileList;

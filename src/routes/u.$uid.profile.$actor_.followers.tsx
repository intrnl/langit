import { For, Match, Show, Switch, createMemo } from 'solid-js';

import { createInfiniteQuery } from '@tanstack/solid-query';

import { type DID } from '~/api/utils.ts';

import { followProfile } from '~/api/mutations/follow-profile.ts';
import { createProfileFollowersQuery, getProfileFollowersKey } from '~/api/queries/get-profile-followers.ts';

import { useParams } from '~/router.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import button from '~/styles/primitives/button.ts';

const PAGE_LIMIT = 30;

const AuthenticatedProfileFollowersPage = () => {
	const params = useParams('/u/:uid/profile/:actor/followers');

	const uid = () => params.uid as DID;

	const followersQuery = createInfiniteQuery({
		queryKey: () => getProfileFollowersKey(uid(), params.actor),
		queryFn: createProfileFollowersQuery(PAGE_LIMIT),
		getNextPageParam: (last) => last.cursor,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	const subject = createMemo(() => {
		return followersQuery.data?.pages[0].subject;
	});

	return (
		<div class='flex flex-col'>
			<div class='bg-background flex items-center h-13 px-4 border-b border-divider sticky top-0 z-10'>
				<div class='flex flex-col gap-0.5'>
					<p class='text-base leading-5 font-bold'>Followers</p>

					<Show when={subject()}>
						{(subject) => <p class='text-xs text-muted-fg'>@{subject().handle.value}</p>}
					</Show>
				</div>
			</div>

			<For each={followersQuery.data ? followersQuery.data.pages : []}>
				{(page) => {
					return page.profiles.map((profile) => {
						const isFollowing = () => profile.viewer.following.value;

						return (
							<div role='button' tabindex={0} class='px-4 py-3 flex gap-3 hover:bg-hinted'>
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
						);
					});
				}}
			</For>

			<Switch>
				<Match when={followersQuery.isFetching}>
					<div class='h-13 flex items-center justify-center border-divider'>
						<CircularProgress />
					</div>
				</Match>

				<Match when={followersQuery.hasNextPage}>
					<button
						onClick={() => followersQuery.fetchNextPage()}
						disabled={followersQuery.isRefetching}
						class='text-sm text-accent flex items-center justify-center h-13 hover:bg-hinted disabled:pointer-events-none'
					>
						Show more
					</button>
				</Match>
			</Switch>
		</div>
	);
};

export default AuthenticatedProfileFollowersPage;

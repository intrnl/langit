import { Show } from 'solid-js';

import { Outlet } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';

import { type DID } from '~/api/utils';

import { getProfile, getProfileKey } from '~/api/queries/get-profile.ts';

import { A, useParams } from '~/router.ts';
import * as comformat from '~/utils/intl/comformatter.ts';

import button from '~/styles/primitives/button.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import TabLink from '~/components/TabLink.tsx';

const AuthenticatedProfileLayout = () => {
	const params = useParams('/u/:uid/profile/:actor');

	const uid = () => params.uid as DID;

	const profileQuery = createQuery({
		queryKey: () => getProfileKey(uid(), params.actor),
		queryFn: getProfile,
		staleTime: 10_000,
	});

	return (
		<div class='flex flex-col'>
			<div class='bg-background flex items-center h-13 px-4 border-b border-divider sticky top-0 z-10'>
				<Show when={profileQuery.data} fallback={<p class='font-bold text-base'>Profile</p>}>
					{(profile) => (
						<div class='flex flex-col gap-0.5'>
							<p class='text-base leading-5 font-bold'>{profile().displayName.value}</p>
							<p class='text-xs text-muted-fg'>{profile().postsCount.value} posts</p>
						</div>
					)}
				</Show>
			</div>

			<Show
				when={profileQuery.data}
				fallback={
					<div class='h-13 flex items-center justify-center'>
						<CircularProgress />
					</div>
				}
			>
				{(profile) => {
					const isFollowing = () => profile().viewer.following.value;

					return (
						<>
							<div class='aspect-banner bg-muted-fg'>
								<Show when={profile().banner.value}>
									{(banner) => <img src={banner()} class='h-full w-full' />}
								</Show>
							</div>

							<div class='flex flex-col gap-3 p-4'>
								<div class='flex gap-2'>
									<div class='shrink-0 h-20 w-20 -mt-11 bg-muted-fg rounded-full overflow-hidden ring-2 ring-background'>
										<Show when={profile().avatar.value}>
											{(avatar) => <img src={avatar()} class='h-full w-full' />}
										</Show>
									</div>

									<div class='grow' />

									<button class={button({ color: isFollowing() ? 'outline' : 'primary' })}>
										{isFollowing() ? 'Following' : 'Follow'}
									</button>
								</div>

								<div>
									<p class='text-xl font-bold'>{profile().displayName.value || profile().handle.value}</p>
									<p class='text-sm text-muted-fg'>@{profile().handle.value}</p>
								</div>

								<Show when={profile().description.value}>
									<div class='text-sm whitespace-pre-wrap break-words'>
										{profile().$renderedDescription(uid())}
									</div>
								</Show>

								<div class='text-sm flex flex-wrap gap-4'>
									<A href='/u/:uid/profile/:actor/following' params={params} class='hover:underline'>
										<span class='font-bold'>{comformat.format(profile().followsCount.value)}</span>{' '}
										<span class='text-muted-fg'>Following</span>
									</A>

									<A href='/u/:uid/profile/:actor/followers' params={params} class='hover:underline'>
										<span class='font-bold'>{comformat.format(profile().followersCount.value)}</span>{' '}
										<span class='text-muted-fg'>Followers</span>
									</A>
								</div>
							</div>

							<div class='flex overflow-x-auto border-b border-divider'>
								<TabLink href='/u/:uid/profile/:actor' params={params} replace end>
									Tweets
								</TabLink>
								<TabLink href='/u/:uid/profile/:actor/with_replies' params={params} replace>
									Replies
								</TabLink>
								<TabLink href='/u/:uid/profile/:actor/likes' params={params} replace>
									Likes
								</TabLink>
							</div>

							<Outlet />
						</>
					);
				}}
			</Show>
		</div>
	);
};

export default AuthenticatedProfileLayout;

import { Match, Show, Switch } from 'solid-js';

import { Outlet } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';

import { type XRPCError } from '~/api/rpc/xrpc-utils.ts';
import { type DID } from '~/api/utils.ts';

import { getProfile, getProfileKey } from '~/api/queries/get-profile.ts';

import { A, useParams } from '~/router.ts';
import { openModal } from '~/globals/modals.tsx';
import * as comformat from '~/utils/intl/comformatter.ts';

import MuteConfirmDialog from '~/components/dialogs/MuteConfirmDialog.tsx';
import ProfileMenu from '~/components/menus/ProfileMenu.tsx';
import CircularProgress from '~/components/CircularProgress.tsx';
import FollowButton from '~/components/FollowButton.tsx';
import TabLink from '~/components/TabLink.tsx';
import button from '~/styles/primitives/button.ts';

import MoreHorizIcon from '~/icons/baseline-more-horiz.tsx';

const AuthenticatedProfileLayout = () => {
	const params = useParams('/u/:uid/profile/:actor');

	const uid = () => params.uid as DID;

	const profileQuery = createQuery({
		queryKey: () => getProfileKey(uid(), params.actor),
		queryFn: getProfile,
		staleTime: 10_000,
		refetchOnWindowFocus: false,
	});

	return (
		<div class="flex grow flex-col">
			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<Show when={profileQuery.data} fallback={<p class="text-base font-bold">Profile</p>}>
					{(profile) => (
						<div class="flex flex-col gap-0.5">
							<p class="line-clamp-1 break-all text-base font-bold leading-5">
								{profile().displayName.value}
							</p>
							<p class="text-xs text-muted-fg">{comformat.format(profile().postsCount.value)} posts</p>
						</div>
					)}
				</Show>
			</div>

			<Switch>
				<Match when={profileQuery.isLoading}>
					<div class="flex h-13 items-center justify-center">
						<CircularProgress />
					</div>
				</Match>

				<Match when={profileQuery.error}>
					{(error) => (
						<Switch fallback={<div class="p-3 text-sm">Something went wrong.</div>}>
							<Match when={(error() as XRPCError).error === 'InvalidRequest'}>
								<div class="grid grow place-items-center">
									<div class="max-w-sm p-4">
										<h1 class="mb-1 text-xl font-bold">Failed to load profile</h1>
										<p class="text-sm">{(error() as XRPCError).message}</p>
									</div>
								</div>
							</Match>
						</Switch>
					)}
				</Match>

				<Match when={profileQuery.data}>
					{(profile) => {
						return (
							<>
								<div class="aspect-banner bg-muted-fg">
									<Show when={profile().banner.value}>
										{(banner) => <img src={banner()} class="h-full w-full" />}
									</Show>
								</div>

								<div class="flex flex-col gap-3 p-4">
									<div class="flex gap-2">
										<div class="-mt-11 h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted-fg ring-2 ring-background">
											<Show when={profile().avatar.value}>
												{(avatar) => <img src={avatar()} class="h-full w-full" />}
											</Show>
										</div>

										<div class="grow" />

										<Show when={profile().did !== uid()}>
											<button
												title="Actions"
												onClick={() => {
													openModal(() => <ProfileMenu uid={uid()} profile={profile()} />);
												}}
												class={/* @once */ button({ color: 'outline' })}
											>
												<MoreHorizIcon class="-mx-1.5 text-base" />
											</button>

											<Show when={!profile().viewer.blocking.value}>
												<FollowButton uid={uid()} profile={profile()} />
											</Show>
										</Show>
									</div>

									<div>
										<p class="line-clamp-1 break-all text-xl font-bold">
											{profile().displayName.value || profile().handle.value}
										</p>
										<p class="line-clamp-1 break-all text-sm text-muted-fg">@{profile().handle.value}</p>
									</div>

									<Show when={profile().description.value}>
										<div class="whitespace-pre-wrap break-words text-sm">
											{profile().$renderedDescription(uid())}
										</div>
									</Show>

									<div class="flex flex-wrap gap-4 text-sm">
										<A href="/u/:uid/profile/:actor/follows" params={params} class="hover:underline">
											<span class="font-bold">{comformat.format(profile().followsCount.value)}</span>{' '}
											<span class="text-muted-fg">Follows</span>
										</A>

										<A href="/u/:uid/profile/:actor/followers" params={params} class="hover:underline">
											<span class="font-bold">{comformat.format(profile().followersCount.value)}</span>{' '}
											<span class="text-muted-fg">Followers</span>
										</A>
									</div>

									<Show when={profile().viewer.muted.value}>
										<div class="text-sm text-muted-fg">
											<p>
												You have muted posts from this account.{' '}
												<button
													onClick={() => {
														openModal(() => <MuteConfirmDialog uid={uid()} profile={profile()} />);
													}}
													class="text-accent hover:underline"
												>
													Unmute
												</button>
											</p>
										</div>
									</Show>
								</div>

								<Show
									when={!profile().viewer.blocking.value}
									fallback={
										<div class="grid grow place-items-center">
											<div class="max-w-sm p-4 py-24">
												<h1 class="mb-1 text-xl font-bold">@{profile().handle.value} is blocked</h1>
												<p class="text-sm text-muted-fg">
													You can't view any of the posts if you've blocked them.
												</p>
											</div>
										</div>
									}
								>
									<div class="flex overflow-x-auto border-b border-divider">
										<TabLink href="/u/:uid/profile/:actor" params={params} replace end>
											Posts
										</TabLink>
										<TabLink href="/u/:uid/profile/:actor/with_replies" params={params} replace>
											Replies
										</TabLink>
										<TabLink href="/u/:uid/profile/:actor/likes" params={params} replace>
											Likes
										</TabLink>
									</div>

									<Outlet />
								</Show>
							</>
						);
					}}
				</Match>
			</Switch>
		</div>
	);
};

export default AuthenticatedProfileLayout;

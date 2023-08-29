import { Match, Show, Switch, lazy } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import type { XRPCError } from '@intrnl/bluesky-client/xrpc-utils';
import { createQuery } from '@intrnl/sq';
import { Title } from '@solidjs/meta';
import { A, Outlet } from '@solidjs/router';

import { getRecordId, getRepoId } from '~/api/utils.ts';

import { getProfileFeeds, getProfileFeedsKey } from '~/api/queries/get-profile-feeds.ts';
import { getProfileLists, getProfileListsKey } from '~/api/queries/get-profile-lists.ts';
import { getInitialProfile, getProfile, getProfileKey } from '~/api/queries/get-profile.ts';

import { openModal } from '~/globals/modals.tsx';
import { isProfileTemporarilyMuted } from '~/globals/preferences.ts';
import { generatePath, useParams } from '~/router.ts';
import * as comformat from '~/utils/intl/comformatter.ts';
import * as relformat from '~/utils/intl/relformatter.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import FollowButton from '~/components/FollowButton.tsx';
import { TabLink } from '~/components/Tab.tsx';
import button from '~/styles/primitives/button.ts';

import MoreHorizIcon from '~/icons/baseline-more-horiz.tsx';

import { ProfileContext } from './ProfileContext.tsx';
import ProfileIdentifierDialog from './ProfileIdentifierDialog.tsx';
import ProfileMenu from './ProfileMenu.tsx';

const ERROR_NAMES = ['InvalidRequest', 'AccountTakedown'];

const LazyMuteConfirmDialog = lazy(() => import('~/components/dialogs/MuteConfirmDialog.tsx'));

const AuthenticatedProfileLayout = () => {
	const params = useParams('/u/:uid/profile/:actor');

	const uid = () => params.uid as DID;
	const actor = () => params.actor;

	const [profile] = createQuery({
		key: () => getProfileKey(uid(), actor()),
		fetch: getProfile,
		staleTime: 10_000,
		refetchOnWindowFocus: false,
		initialData: getInitialProfile,
	});

	const [lists] = createQuery({
		key: () => getProfileListsKey(uid(), actor()),
		fetch: getProfileLists,
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
	});

	const [feeds] = createQuery({
		key: () => getProfileFeedsKey(uid(), actor()),
		fetch: getProfileFeeds,
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
	});

	return (
		<div class="flex grow flex-col">
			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<Switch>
					<Match when={profile()}>
						{(profile) => (
							<div class="flex flex-col gap-0.5">
								<Title>
									{profile().displayName.value
										? `${profile().displayName.value} (@${profile().handle.value})`
										: `@${profile().handle.value}`}{' '}
									/ Langit
								</Title>

								<p dir="auto" class="line-clamp-1 break-all text-base font-bold leading-5">
									{profile().displayName.value || profile().handle.value}
								</p>
								<p class="text-xs text-muted-fg">{comformat.format(profile().postsCount.value)} posts</p>
							</div>
						)}
					</Match>

					<Match when>
						<Title>Profile ({actor()}) / Langit</Title>
						<p class="text-base font-bold">Profile</p>
					</Match>
				</Switch>
			</div>

			<Switch>
				<Match when={profile.error}>
					{(error) => (
						<Switch fallback={<div class="p-3 text-sm">Something went wrong.</div>}>
							<Match when={ERROR_NAMES.includes((error() as XRPCError).error!)}>
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

				<Match when={profile()}>
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
										<div class="-mt-11 h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted-fg outline-2 outline-background outline">
											<Show when={profile().avatar.value}>
												{(avatar) => <img src={avatar()} class="h-full w-full" />}
											</Show>
										</div>

										<div class="grow" />

										<Switch>
											<Match when={profile().did === uid()}>
												<A
													href={generatePath('/u/:uid/settings/profile', params)}
													class={/* @once */ button({ color: 'primary' })}
												>
													Edit profile
												</A>
											</Match>

											<Match when>
												<button
													title="Actions"
													onClick={() => {
														openModal(() => <ProfileMenu uid={uid()} profile={profile()} />);
													}}
													class={/* @once */ button({ color: 'outline' })}
												>
													<MoreHorizIcon class="-mx-1.5 text-base" />
												</button>

												<Show when={!profile().viewer.blocking.value && !profile().viewer.blockedBy.value}>
													<FollowButton uid={uid()} profile={profile()} />
												</Show>
											</Match>
										</Switch>
									</div>

									<div>
										<p dir="auto" class="line-clamp-1 break-all text-xl font-bold">
											{profile().displayName.value || profile().handle.value}
										</p>
										<p class="flex items-center text-sm text-muted-fg">
											<button
												onClick={() => {
													openModal(() => <ProfileIdentifierDialog profile={profile()} />);
												}}
												class="hover:underline"
											>
												<span class="line-clamp-1 break-all text-left">@{profile().handle.value}</span>
											</button>

											<Show when={profile().viewer.followedBy.value}>
												<span class="ml-2 shrink-0 rounded bg-muted px-1 py-px text-xs font-medium text-primary">
													Follows you
												</span>
											</Show>
										</p>
									</div>

									<Show when={profile().description.value}>
										<div class="whitespace-pre-wrap break-words text-sm">
											{profile().$renderedDescription()}
										</div>
									</Show>

									<div class="flex flex-wrap gap-4 text-sm">
										<A href={generatePath('/u/:uid/profile/:actor/follows', params)} class="hover:underline">
											<span class="font-bold">{comformat.format(profile().followsCount.value)}</span>{' '}
											<span class="text-muted-fg">Follows</span>
										</A>

										<A
											href={generatePath('/u/:uid/profile/:actor/followers', params)}
											class="hover:underline"
										>
											<span class="font-bold">{comformat.format(profile().followersCount.value)}</span>{' '}
											<span class="text-muted-fg">Followers</span>
										</A>
									</div>

									<Switch>
										<Match when={profile().viewer.mutedByList.value}>
											{(list) => (
												<div class="text-sm text-muted-fg">
													<p>
														This user is muted by{' '}
														<A
															href={generatePath('/u/:uid/profile/:actor/lists/:list', {
																uid: uid(),
																actor: getRepoId(list().uri),
																list: getRecordId(list().uri),
															})}
															class="text-accent hover:underline"
														>
															{list().name}
														</A>
													</p>
												</div>
											)}
										</Match>

										<Match when={profile().viewer.muted.value}>
											<div class="text-sm text-muted-fg">
												<p>
													You have muted posts from this user.{' '}
													<button
														onClick={() => {
															openModal(() => <LazyMuteConfirmDialog uid={uid()} profile={profile()} />);
														}}
														class="text-accent hover:underline"
													>
														Unmute
													</button>
												</p>
											</div>
										</Match>

										<Match when={isProfileTemporarilyMuted(uid(), profile().did)}>
											{(date) => (
												<div class="text-sm text-muted-fg">
													<p>
														You have temporarily muted posts from this user until{' '}
														<span class="font-bold">{relformat.formatAbsWithTime(date())}</span>.{' '}
														<button
															onClick={() => {
																openModal(() => <LazyMuteConfirmDialog uid={uid()} profile={profile()} />);
															}}
															class="text-accent hover:underline"
														>
															Unmute
														</button>
													</p>
												</div>
											)}
										</Match>
									</Switch>
								</div>

								<Switch>
									<Match when={profile().viewer.blockedBy.value}>
										<div class="grid grow place-items-center">
											<div class="max-w-sm p-4 py-24">
												<h1 class="mb-1 text-xl font-bold">You are blocked</h1>
												<p class="text-sm text-muted-fg">
													You can't view any of the posts if you are blocked.
												</p>
											</div>
										</div>
									</Match>

									<Match when={profile().viewer.blocking.value}>
										<div class="grid grow place-items-center">
											<div class="max-w-sm p-4 py-24">
												<h1 class="mb-1 text-xl font-bold">@{profile().handle.value} is blocked</h1>
												<p class="text-sm text-muted-fg">
													You can't view any of the posts if you've blocked them.
												</p>
											</div>
										</div>
									</Match>

									<Match when>
										<div class="flex h-13 overflow-x-auto border-b border-divider">
											<TabLink href={generatePath('/u/:uid/profile/:actor', params)} replace end>
												Posts
											</TabLink>
											<TabLink href={generatePath('/u/:uid/profile/:actor/with_replies', params)} replace>
												Replies
											</TabLink>
											<TabLink href={generatePath('/u/:uid/profile/:actor/media', params)} replace>
												Media
											</TabLink>
											<TabLink href={generatePath('/u/:uid/profile/:actor/likes', params)} replace>
												Likes
											</TabLink>

											<Show when={!!lists()?.pages[0]?.lists.length}>
												<TabLink href={generatePath('/u/:uid/profile/:actor/lists', params)} replace>
													Lists
												</TabLink>
											</Show>

											<Show when={!!feeds()?.pages[0]?.feeds.length}>
												<TabLink href={generatePath('/u/:uid/profile/:actor/feed', params)} replace>
													Feeds
												</TabLink>
											</Show>
										</div>

										<ProfileContext.Provider value={{ uid, profile }}>
											<Outlet />
										</ProfileContext.Provider>
									</Match>
								</Switch>
							</>
						);
					}}
				</Match>

				<Match when>
					<div class="flex h-13 items-center justify-center">
						<CircularProgress />
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default AuthenticatedProfileLayout;

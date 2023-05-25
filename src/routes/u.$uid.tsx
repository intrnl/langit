import { Show } from 'solid-js';

import { Navigate, Outlet, useLocation } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';

import { multiagent } from '~/api/global.ts';
import { type DID } from '~/api/utils.ts';

import { getProfile, getProfileKey } from '~/api/queries/get-profile.ts';

import { A, useParams } from '~/router.ts';
import { useMediaQuery } from '~/utils/media-query.ts';

import AddBoxIcon from '~/icons/baseline-add-box.tsx';
import HomeIcon from '~/icons/baseline-home.tsx';
import NotificationsIcon from '~/icons/baseline-notifications.tsx';
import SearchIcon from '~/icons/baseline-search.tsx';
import AddBoxOutlinedIcon from '~/icons/outline-add-box.tsx';
import HomeOutlinedIcon from '~/icons/outline-home.tsx';
import NotificationsOutlinedIcon from '~/icons/outline-notifications.tsx';

const AuthenticatedLayout = () => {
	const location = useLocation();
	const params = useParams('/u/:uid');

	const uid = () => params.uid as DID;

	if (!multiagent.accounts || !multiagent.accounts[uid()]) {
		const path = location.pathname.slice(4 + params.uid.length);
		return <Navigate href={`/login?to=${encodeURIComponent('@uid/' + path)}`} />;
	}

	const isDesktop = useMediaQuery('(width >= 640px)');

	const profileQuery = createQuery({
		queryKey: () => getProfileKey(uid(), uid()),
		queryFn: getProfile,
		staleTime: 60_000,
		refetchOnMount: true,
		refetchOnReconnect: true,
		refetchOnWindowFocus: false,
	});

	return (
		<div class="mx-auto flex min-h-screen max-w-7xl flex-col sm:flex-row sm:justify-center">
			<Show when={isDesktop()}>
				<div class="sticky top-0 flex h-screen flex-col items-end xl:basis-1/4">
					<div class="flex grow flex-col gap-2 p-2 lg:p-4 xl:w-64">
						<A
							href="/u/:uid"
							params={{ uid: params.uid }}
							title="Home"
							class="group flex items-center rounded-md hover:bg-hinted"
							activeClass="is-active"
							end
						>
							<div class="p-2">
								<HomeOutlinedIcon class="text-2xl group-[.is-active]:hidden" />
								<HomeIcon class="hidden text-2xl group-[.is-active]:block" />
							</div>

							<span class="hidden text-base group-[.is-active]:font-medium xl:inline">Home</span>
						</A>

						<A
							href="/u/:uid/search"
							params={{ uid: params.uid }}
							title="Search"
							class="group flex items-center rounded-md hover:bg-hinted"
							activeClass="is-active"
						>
							<div class="p-2">
								<SearchIcon class="text-2xl group-[.is-active]:stroke-primary" />
							</div>

							<span class="hidden text-base group-[.is-active]:font-medium xl:inline">Search</span>
						</A>

						<A
							href="/u/:uid/notifications"
							params={{ uid: params.uid }}
							title="Notifications"
							class="group flex items-center rounded-md hover:bg-hinted"
							activeClass="is-active"
						>
							<div class="p-2">
								<NotificationsOutlinedIcon class="text-2xl group-[.is-active]:hidden" />
								<NotificationsIcon class="hidden text-2xl group-[.is-active]:block" />
							</div>

							<span class="hidden text-base group-[.is-active]:font-medium xl:inline">Notifications</span>
						</A>

						<div class="grow" />

						<A
							href="/u/:uid/compose"
							params={{ uid: params.uid }}
							title="Compose"
							class="group flex items-center rounded-md hover:bg-hinted"
							activeClass="is-active"
						>
							<div class="p-2">
								<AddBoxOutlinedIcon class="text-2xl group-[.is-active]:hidden" />
								<AddBoxIcon class="hidden text-2xl group-[.is-active]:block" />
							</div>

							<span class="hidden text-base group-[.is-active]:font-medium xl:inline">Compose</span>
						</A>

						<A
							href="/u/:uid/you"
							params={{ uid: params.uid }}
							title="You"
							class="group flex items-center rounded-md hover:bg-hinted"
							activeClass="is-active"
						>
							<div class="p-2">
								<div class="h-6 w-6 overflow-hidden rounded-full bg-muted-fg ring-primary group-[.is-active]:ring-2">
									<Show when={profileQuery.data?.avatar.value}>
										{(avatar) => <img src={avatar()} class="h-full w-full object-cover" />}
									</Show>
								</div>
							</div>

							<span class="hidden overflow-hidden text-ellipsis text-base group-[.is-active]:font-medium xl:inline">
								<Show when={profileQuery.data} fallback="You">
									{(profile) => <>{profile().displayName.value || '@' + profile().handle.value}</>}
								</Show>
							</span>
						</A>
					</div>
				</div>
			</Show>

			<div class="flex min-w-0 max-w-2xl shrink grow flex-col border-divider sm:border-x xl:max-w-none xl:basis-2/4">
				<Outlet />
			</div>

			<div class="hidden basis-1/4 xl:block"></div>

			<Show when={!isDesktop()}>
				<div class="sticky bottom-0 flex h-13 border-t border-divider bg-background text-primary">
					<A
						href="/u/:uid"
						params={{ uid: params.uid }}
						title="Home"
						class="group flex grow basis-0 items-center justify-center text-2xl"
						activeClass="is-active"
						end
					>
						<HomeOutlinedIcon class="group-[.is-active]:hidden" />
						<HomeIcon class="hidden group-[.is-active]:block" />
					</A>
					<A
						href="/u/:uid/search"
						params={{ uid: params.uid }}
						title="Search"
						class="group flex grow basis-0 items-center justify-center text-2xl"
						activeClass="is-active"
					>
						<SearchIcon class="group-[.is-active]:stroke-primary" />
					</A>
					<A
						href="/u/:uid/compose"
						params={{ uid: params.uid }}
						title="Compose"
						class="group flex grow basis-0 items-center justify-center text-2xl"
						activeClass="is-active"
					>
						<AddBoxOutlinedIcon class="group-[.is-active]:hidden" />
						<AddBoxIcon class="hidden group-[.is-active]:block" />
					</A>
					<A
						href="/u/:uid/notifications"
						params={{ uid: params.uid }}
						title="Notifications"
						class="group flex grow basis-0 items-center justify-center text-2xl"
						activeClass="is-active"
					>
						<NotificationsOutlinedIcon class="group-[.is-active]:hidden" />
						<NotificationsIcon class="hidden group-[.is-active]:block" />
					</A>
					<A
						href="/u/:uid/you"
						params={{ uid: params.uid }}
						title="You"
						class="group flex grow basis-0 items-center justify-center text-2xl"
						activeClass="is-active"
					>
						<div class="h-6 w-6 overflow-hidden rounded-full bg-muted-fg ring-primary group-[.is-active]:ring-2">
							<Show when={profileQuery.data?.avatar.value}>
								{(avatar) => <img src={avatar()} class="h-full w-full object-cover" />}
							</Show>
						</div>
					</A>
				</div>
			</Show>
		</div>
	);
};

export default AuthenticatedLayout;

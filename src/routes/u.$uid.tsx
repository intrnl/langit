import { Outlet } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { Show, createMemo } from 'solid-js';

import { multiagent } from '~/api/global.ts';
import { getProfile, getProfileKey } from '~/api/query.ts';

import { A, Navigate, useParams } from '~/router.ts';
import { useMediaQuery } from '~/utils/media-query';

import AddBoxIcon from '~/icons/baseline-add-box.tsx';
import HomeIcon from '~/icons/baseline-home.tsx';
import NotificationsIcon from '~/icons/baseline-notifications.tsx';
import SearchIcon from '~/icons/baseline-search.tsx';
import AddBoxOutlinedIcon from '~/icons/outline-add-box.tsx';
import HomeOutlinedIcon from '~/icons/outline-home.tsx';
import NotificationsOutlinedIcon from '~/icons/outline-notifications.tsx';

const AuthenticatedLayout = () => {
	const params = useParams('/u/:uid');

	if (!multiagent.accounts || !multiagent.accounts[params.uid]) {
		return <Navigate href='/' />;
	}

	const isDesktop = useMediaQuery('(width >= 768px)');
	// const isLargeDesktop = useMediaQuery('(width >= 1280px)');

	const did = createMemo(() => {
		return multiagent.accounts[params.uid].session.did;
	});

	const profileQuery = createQuery({
		queryKey: () => getProfileKey(params.uid, did()),
		queryFn: getProfile,
		staleTime: 60000,
		refetchOnMount: true,
		refetchOnReconnect: true,
		refetchOnWindowFocus: false,
	});

	return (
		<div
			class='flex max-w-7xl min-h-screen mx-auto'
			classList={{ 'flex-row gap-4': isDesktop(), 'flex-col': !isDesktop() }}
		>
			<Show when={isDesktop()}>
				<div class='flex flex-col basis-1/4 grow items-end h-screen sticky top-0'>
					<div class='flex flex-col grow w-64 py-4'>
						<A
							href='/u/:uid'
							params={{ uid: params.uid }}
							class='group flex items-center gap-3 p-3 rounded-md text-left text-base hover:bg-hinted hover:text-hinted-fg'
							activeClass='is-active'
							end
						>
							<HomeOutlinedIcon class='text-2xl group-[.is-active]:hidden' />
							<HomeIcon class='text-2xl hidden group-[.is-active]:block' />

							<span class='group-[.is-active]:font-medium'>Home</span>
						</A>

						<Show when={profileQuery.data} keyed>
							{(profile) => (
								<button class='flex items-center gap-3 p-3 rounded-md text-left text-base hover:bg-hinted hover:text-hinted-fg'>
									<div class='h-10 w-10 rounded-full bg-muted-fg overflow-hidden'>
										<Show when={profile.avatar.value}>
											{(avatar) => <img src={avatar()} class='h-full w-full' />}
										</Show>
									</div>

									<div>
										<p class='text-primary text-sm font-bold'>
											{profile.displayName.value}
										</p>
										<p class='text-muted-fg text-sm'>
											@{profile.handle.value}
										</p>
									</div>
								</button>
							)}
						</Show>
					</div>
				</div>
			</Show>

			<div class='flex flex-col grow shrink basis-2/4 min-w-0'>
				<Outlet />
			</div>

			<Show when={isDesktop()}>
				<div class='basis-1/4'>
				</div>
			</Show>

			<Show when={!isDesktop()}>
				<div class='bg-background text-primary flex h-13 border-t border-divider sticky bottom-0'>
					<A
						href='/u/:uid'
						params={{ uid: params.uid }}
						title='Home'
						class='group flex items-center justify-center grow basis-0 text-2xl'
						activeClass='is-active'
						end
					>
						<HomeOutlinedIcon class='group-[.is-active]:hidden' />
						<HomeIcon class='hidden group-[.is-active]:block' />
					</A>
					<A
						href='/u/:uid/search'
						params={{ uid: params.uid }}
						title='Search'
						class='group flex items-center justify-center grow basis-0 text-2xl'
						activeClass='is-active'
					>
						<SearchIcon class='group-[.is-active]:stroke-primary' />
					</A>
					<A
						href='/u/:uid/compose'
						params={{ uid: params.uid }}
						title='Compose'
						class='group flex items-center justify-center grow basis-0 text-2xl'
						activeClass='is-active'
					>
						<AddBoxOutlinedIcon class='group-[.is-active]:hidden' />
						<AddBoxIcon class='hidden group-[.is-active]:block' />
					</A>
					<A
						href='/u/:uid/notifications'
						params={{ uid: params.uid }}
						title='Notifications'
						class='group flex items-center justify-center grow basis-0 text-2xl'
						activeClass='is-active'
					>
						<NotificationsOutlinedIcon class='group-[.is-active]:hidden' />
						<NotificationsIcon class='hidden group-[.is-active]:block' />
					</A>
					<A
						href='/u/:uid/you'
						params={{ uid: params.uid }}
						title='You'
						class='group flex items-center justify-center grow basis-0 text-2xl'
						activeClass='is-active'
					>
						<div class='h-6 w-6 rounded-full bg-muted-fg ring-primary overflow-hidden group-[.is-active]:ring-2'>
							<Show when={profileQuery.data?.avatar.value}>
								{(avatar) => <img src={avatar()} class='h-full w-full object-cover' />}
							</Show>
						</div>
					</A>
				</div>
			</Show>
		</div>
	);
};

export default AuthenticatedLayout;

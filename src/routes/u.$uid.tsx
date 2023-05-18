import { Outlet } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { Show, createMemo } from 'solid-js';

import { multiagent } from '~/api/global.ts';
import { getProfile, getProfileKey } from '~/api/query.ts';
import { A, Navigate, useParams } from '~/router.ts';

import HomeIcon from '~/icons/baseline-home.tsx';
import NotificationsIcon from '~/icons/baseline-notifications.tsx';
import SearchIcon from '~/icons/baseline-search.tsx';
import HomeOutlinedIcon from '~/icons/outline-home.tsx';
import NotificationsOutlinedIcon from '~/icons/outline-notifications.tsx';

const AuthenticatedLayout = () => {
	const params = useParams('/u/:uid');

	if (!multiagent.accounts || !multiagent.accounts[params.uid]) {
		return <Navigate href='/' />;
	}

	const did = createMemo(() => {
		return multiagent.accounts[params.uid].session.did;
	});

	const profileQuery = createQuery({
		queryKey: () => getProfileKey(params.uid, did()),
		queryFn: getProfile,
		staleTime: 60000,
	});

	return (
		<div class='flex flex-col max-w-7xl min-h-screen mx-auto md:flex-row md:gap-4'>
			{
				/* <div class='hidden md:flex flex-col basis-1/4 grow items-end'>
				<div class='flex flex-col grow w-64'>
					<button class='flex items-center gap-3 p-3 rounded-md text-left text-base hover:bg-hinted hover:text-hinted-fg'>
						Home
					</button>

					<Show when={profileQuery.data} keyed>
						{(profile) => (
							<button class='flex items-center gap-3 p-3 rounded-md text-left text-base hover:bg-hinted hover:text-hinted-fg'>
								{profile.avatar
									? <img src={profile.avatar} class='h-10 w-10 rounded-full bg-muted-fg' />
									: <div class='h-10 w-10 rounded-full bg-muted-fg' />}

								<div>
									<p class='text-primary text-sm font-bold'>
										{profile.displayName}
									</p>
									<p class='text-muted-fg text-sm'>
										@{profile.handle}
									</p>
								</div>
							</button>
						)}
					</Show>
				</div>
			</div> */
			}

			<div class='grow shrink basis-3/4'>
				<Outlet />
			</div>

			<div class='bg-background text-primary flex h-13 border-t border-divider sticky bottom-0 md:hidden'>
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
						<Show when={profileQuery.data?.avatar}>
							{(avatar) => <img src={avatar()} class='h-full w-full object-cover' />}
						</Show>
					</div>
				</A>
			</div>
		</div>
	);
};

export default AuthenticatedLayout;

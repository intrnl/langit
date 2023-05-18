import { Show } from 'solid-js';

import { Outlet } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';

import { getProfile, getProfileKey } from '~/api/query';

import CircularProgress from '~/components/CircularProgress';
import { useParams } from '~/router';

const AuthenticatedProfileLayout = () => {
	const params = useParams('/u/:uid/profile/:handle');

	const profileQuery = createQuery({
		queryKey: () => getProfileKey(params.uid, params.handle),
		queryFn: getProfile,
		staleTime: 10_000,
	});

	return (
		<div>
			<div class='bg-background flex items-center h-13 px-4 border-b border-divider sticky top-0 z-10'>
				<Show when={profileQuery.data} fallback={<p class='font-bold text-base'>Profile</p>}>
					{(profile) => (
						<div class='flex flex-col gap-0.5'>
							<p class='text-base leading-5 font-bold'>{profile().displayName}</p>
							<p class='text-xs text-muted-fg'>{profile().postsCount} posts</p>
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
				{(profile) => (
					<>
						<Outlet />
					</>
				)}
			</Show>
		</div>
	);
};

export default AuthenticatedProfileLayout;

// import input from '~/styles/primitives/input.ts';

import { A, useParams } from '~/router.ts';

import SettingsIcon from '~/icons/baseline-settings.tsx';

const AuthenticatedSearchPage = () => {
	const params = useParams('/u/:uid/explore');

	return (
		<div class="flex grow flex-col">
			<div class="sticky top-0 z-10 flex h-13 items-center gap-4 border-b border-divider bg-background px-4">
				{/* <input placeholder="Search Bluesky" class={input()} /> */}
				<p class="grow text-base font-bold">Explore</p>

				<A
					href="/u/:uid/settings/explore"
					params={params}
					class="-mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base hover:bg-secondary"
				>
					<SettingsIcon />
				</A>
			</div>
		</div>
	);
};

export default AuthenticatedSearchPage;

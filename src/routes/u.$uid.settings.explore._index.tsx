import { For, createMemo } from 'solid-js';

import { preferences } from '~/api/global.ts';
import { type DID } from '~/api/utils.ts';

import { A, useParams } from '~/router.ts';

import AddIcon from '~/icons/baseline-add.tsx';

const AuthenticatedExploreSettingsPage = () => {
	const params = useParams('/u/:uid/settings/explore');

	const uid = () => params.uid as DID;

	const savedFeeds = createMemo(() => {
		return preferences.get(uid())?.savedFeeds || [];
	});

	const pinnedFeeds = createMemo(() => {
		return preferences.get(uid())?.pinnedFeeds || [];
	});

	return (
		<div class="flex flex-col">
			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold leading-5">Explore settings</p>
			</div>

			<p class="px-4 py-4 text-base font-bold leading-5">Custom feeds</p>
			<For each={savedFeeds()}>{(feed) => <div></div>}</For>

			<A
				href="/u/:uid/settings/explore/add"
				params={params}
				class="flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted"
			>
				<AddIcon class="text-2xl" />
				<span>Add new feed</span>
			</A>
		</div>
	);
};

export default AuthenticatedExploreSettingsPage;

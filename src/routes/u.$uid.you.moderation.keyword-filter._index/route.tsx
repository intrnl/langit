import { For, createMemo } from 'solid-js';

import type { DID } from '@externdefs/bluesky-client/atp-schema';

import {
	type KeywordPreference,
	PreferenceHide,
	PreferenceIgnore,
	PreferenceWarn,
} from '~/api/moderation/enums.ts';

import { getModerationPref } from '~/globals/settings.ts';
import { generatePath, useParams } from '~/router.ts';
import { Title } from '~/utils/meta.tsx';

import AddIcon from '~/icons/baseline-add.tsx';

const renderPrefName = (pref: KeywordPreference) => {
	switch (pref) {
		case PreferenceHide:
			return `Hide`;
		case PreferenceIgnore:
			return `Disabled`;
		case PreferenceWarn:
			return `Warn`;
	}
};

const AuthenticatedAddFilterModerationPage = () => {
	const params = useParams('/u/:uid/you/moderation/keyword-filter');

	const uid = () => params.uid as DID;

	const keywords = createMemo(() => {
		const prefs = getModerationPref(uid());
		return prefs.keywords;
	});

	return (
		<div class="flex flex-col">
			<Title render={`Keyword filters / Langit`} />

			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Keyword filters</p>

				<div class="grow" />

				<a
					link
					title="Add new filter"
					href={generatePath('/u/:uid/you/moderation/keyword-filter/add', params)}
					class="-mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg hover:bg-secondary"
				>
					<AddIcon />
				</a>
			</div>

			<For
				each={keywords()}
				fallback={<p class="p-4 text-sm text-muted-fg">You don't have any keyword filters set up yet.</p>}
			>
				{(filter) => (
					<a
						link
						href={generatePath('/u/:uid/you/moderation/keyword-filter/:fid/edit', {
							uid: uid(),
							fid: '' + filter.id,
						})}
						class="px-4 py-3 hover:bg-hinted"
					>
						<div class="text-sm">
							<p class="font-bold">{filter.name}</p>
							<p class="text-muted-fg">
								{filter.matchers.length} keywords muted · {renderPrefName(filter.pref)}
							</p>
						</div>
					</a>
				)}
			</For>
		</div>
	);
};

export default AuthenticatedAddFilterModerationPage;

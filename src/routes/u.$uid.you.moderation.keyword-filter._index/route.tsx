import { For, createMemo } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { Title } from '@solidjs/meta';
import { A } from '@solidjs/router';

import {
	type KeywordPreference,
	PreferenceHide,
	PreferenceIgnore,
	PreferenceWarn,
} from '~/api/moderation/enums.ts';

import { getAccountPreferences } from '~/globals/preferences.ts';
import { generatePath, useParams } from '~/router.ts';

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

	const prefs = createMemo(() => {
		return getAccountPreferences(uid());
	});

	return (
		<div class="flex flex-col">
			<Title>Keyword filters / Langit</Title>

			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Keyword filters</p>

				<div class="grow" />

				<A
					title="Add new filter"
					href={generatePath('/u/:uid/you/moderation/keyword-filter/add', params)}
					class="-mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg hover:bg-secondary"
				>
					<AddIcon />
				</A>
			</div>

			<For
				each={prefs().cf_keywords}
				fallback={<p class="p-4 text-sm text-muted-fg">You don't have any keyword filters set up yet.</p>}
			>
				{(filter) => (
					<A
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
					</A>
				)}
			</For>
		</div>
	);
};

export default AuthenticatedAddFilterModerationPage;

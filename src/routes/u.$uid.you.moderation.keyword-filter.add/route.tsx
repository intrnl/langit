import type { DID } from '@intrnl/bluesky-client/atp-schema';
import { Title } from '@solidjs/meta';

import { getAccountModerationPreferences } from '~/globals/preferences.ts';
import { useNavigate, useParams } from '~/router.ts';

import { createRegexMatcher } from './utils.ts';
import KeywordFilterForm from './KeywordFilterForm.tsx';

const AuthenticatedFilterModerationPage = () => {
	const params = useParams('/u/:uid/you/moderation/keyword-filter/add');
	const navigate = useNavigate();

	const uid = () => params.uid as DID;

	return (
		<div class="flex flex-col">
			<Title>Add keyword filter / Langit</Title>

			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Add keyword filter</p>
			</div>

			<KeywordFilterForm
				onSubmit={(fields) => {
					const prefs = getAccountModerationPreferences(uid());

					prefs.filters.push({
						id: '' + Date.now(),

						name: fields.name,
						pref: fields.pref,
						match: createRegexMatcher(fields.matchers),

						matchers: fields.matchers,
					});

					if (history.state) {
						navigate(-1);
					} else {
						navigate(`/u/:uid/you/moderation/keyword-filter`, { params });
					}
				}}
			/>
		</div>
	);
};

export default AuthenticatedFilterModerationPage;

import { Match, Switch, batch, createMemo } from 'solid-js';

import type { DID } from '@externdefs/bluesky-client/atp-schema';

import { getModerationPref } from '~/globals/settings.ts';
import { useNavigate, useParams } from '~/router.ts';
import { Title } from '~/utils/meta.tsx';

import { createRegexMatcher } from '../u.$uid.you.moderation.keyword-filter.add/utils.ts';
import KeywordFilterForm from '../u.$uid.you.moderation.keyword-filter.add/KeywordFilterForm.tsx';

const AuthenticatedEditFilterModerationPage = () => {
	const params = useParams('/u/:uid/you/moderation/keyword-filter/:fid/edit');
	const navigate = useNavigate();

	const uid = () => params.uid as DID;
	const fid = () => params.fid;

	const filter = createMemo(() => {
		const prefs = getModerationPref(uid());
		const id = fid();

		return prefs.keywords.find((def) => def.id === id);
	});

	const navigateBack = () => {
		if (history.state) {
			navigate(-1);
		} else {
			navigate('/u/:uid/you/moderation/keyword-filter', { params });
		}
	};

	return (
		<div class="flex grow flex-col">
			<Title
				render={() => {
					const $filter = filter();

					if ($filter) {
						return `Edit "${$filter.name}" keyword filter / Langit`;
					}

					return `Edit keyword filter / Langit`;
				}}
			/>

			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Edit keyword filter</p>
			</div>

			<Switch>
				<Match when={filter()} keyed>
					{($filter) => (
						<KeywordFilterForm
							initialData={$filter}
							onSubmit={(fields) => {
								navigateBack();

								batch(() => {
									$filter.name = fields.name;
									$filter.pref = fields.pref;
									$filter.match = createRegexMatcher(fields.matchers);

									$filter.matchers = fields.matchers;
								});
							}}
							onDelete={() => {
								const prefs = getModerationPref(uid());
								const index = prefs.keywords.indexOf($filter);

								navigateBack();

								if (index !== -1) {
									prefs.keywords.splice(index, 1);
								}
							}}
						/>
					)}
				</Match>

				<Match when>
					<div class="grid grow place-items-center">
						<div class="max-w-sm p-4">
							<h1 class="mb-1 text-xl font-bold">Failed to load</h1>
							<p class="text-sm">Keyword filter not found</p>
						</div>
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default AuthenticatedEditFilterModerationPage;

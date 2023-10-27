import { Match, Show, Switch, createMemo } from 'solid-js';
import type { DID } from '@externdefs/bluesky-client/atp-schema';

import { useParams } from '~/router.ts';
import { getModerationPref } from '~/globals/settings.ts';
import { Title } from '~/utils/meta.tsx';

import { LABELERS } from '../u.$uid.you.moderation.content-filter._index/types.ts';
import FilterOptions, {
	TargetLabeler,
} from '../u.$uid.you.moderation.content-filter.global/FilterOptions.tsx';

const AuthenticatedLabelProviderFilterModerationPage = () => {
	const params = useParams('/u/:uid/you/moderation/content-filter/labeler/:labeler');

	const uid = () => params.uid as DID;
	const labeler = () => params.labeler as DID;

	// NOTE: this can return undefined
	const labelProvider = createMemo(() => {
		const $labeler = labeler();
		return LABELERS.find((labeler) => labeler.did === $labeler);
	});

	// NOTE: this can return undefined
	const labelerSettings = createMemo(() => {
		const prefs = getModerationPref(uid());
		return prefs.labelers[labeler()];
	});

	return (
		<div class="flex grow flex-col">
			<Title
				render={() => {
					const $provider = labelerSettings() && labelProvider();

					if ($provider) {
						return `Label provider content filters (@${$provider.handle}) / Langit`;
					}

					return `Label provider content filters / Langit`;
				}}
			/>

			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<div class="flex flex-col gap-0.5">
					<p class="text-base font-bold leading-5">Label provider content filters</p>

					<Show when={labelerSettings() && labelProvider()}>
						{(subject) => <p class="text-xs text-muted-fg">@{subject().handle}</p>}
					</Show>
				</div>
			</div>

			<Switch>
				<Match when={!labelProvider() || !labelerSettings()}>
					<div class="grid grow place-items-center">
						<div class="max-w-sm p-4">
							<h1 class="mb-1 text-xl font-bold">Failed to load</h1>
							<p class="text-sm">Label provider not found</p>
						</div>
					</div>
				</Match>

				<Match when>
					<p class="px-4 py-4 text-[0.8125rem] text-muted-fg">
						These preferences are applied to any content that has been labeled by this label provider.
					</p>

					<FilterOptions uid={uid()} target={{ type: TargetLabeler, prefs: labelerSettings()! }} />
				</Match>
			</Switch>
		</div>
	);
};

export default AuthenticatedLabelProviderFilterModerationPage;

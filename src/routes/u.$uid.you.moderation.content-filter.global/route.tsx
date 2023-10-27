import type { DID } from '@externdefs/bluesky-client/atp-schema';

import { useParams } from '~/router.ts';
import { Title } from '~/utils/meta.tsx';

import FilterOptions, { TargetGlobal } from './FilterOptions.tsx';

const AuthenticatedGlobalFilterModerationPage = () => {
	const params = useParams('/u/:uid/you/moderation/content-filter/global');

	const uid = () => params.uid as DID;

	return (
		<div class="flex flex-col">
			<Title render={`Global content filters / Langit`} />

			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Global content filters</p>
			</div>

			<p class="px-4 py-4 text-[0.8125rem] text-muted-fg">
				These preferences are applied to self-labeled content and any label providers you are subscribed to.
			</p>

			<FilterOptions uid={uid()} target={{ type: TargetGlobal }} />
		</div>
	);
};

export default AuthenticatedGlobalFilterModerationPage;

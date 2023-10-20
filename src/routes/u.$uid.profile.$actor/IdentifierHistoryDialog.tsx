import { createQuery } from '@intrnl/sq';
import { For, Match, Switch } from 'solid-js';

import type { SignalizedProfile } from '~/api/cache/profiles.ts';
import { getIdentifierHistory, getIdentifierHistoryKey } from '~/api/queries/get-identifier-history.ts';

import * as relformat from '~/utils/intl/relformatter.ts';

import CircularProgress from '~/components/CircularProgress.tsx';
import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';

export interface IdentifierHistoryDialogProps {
	profile: SignalizedProfile;
}

const IdentifierHistoryDialog = (props: IdentifierHistoryDialogProps) => {
	const profile = () => props.profile;

	const [history] = createQuery({
		key: () => getIdentifierHistoryKey(profile().did),
		fetch: getIdentifierHistory,
		staleTime: 120_000,
		refetchOnWindowFocus: false,
	});

	return (
		<div class={/* @once */ dialog.content()}>
			<h1 class={/* @once */ dialog.title()}>Handle history</h1>

			<Switch>
				<Match when={history()}>
					{(history) => (
						<ul class="-mx-4 mt-3 flex list-none flex-col gap-2 overflow-y-auto px-4">
							<For each={history().entries}>
								{(entry, idx) => (
									<li
										class="border-l-4 py-1 pl-3 text-sm"
										classList={{ 'border-muted': idx() !== 0, 'border-accent': idx() === 0 }}
									>
										<ul classList={{ 'mb-1 list-disc pl-4': entry.knownAs.length > 1 }}>
											{entry.knownAs.map((handle) => (
												<li class="break-words">{handle}</li>
											))}
										</ul>
										<p class="text-muted-fg">{relformat.formatAbsWithTime(entry.createdAt)}</p>
									</li>
								)}
							</For>
						</ul>
					)}
				</Match>

				<Match when>
					<div class="mt-3 flex justify-center">
						<CircularProgress />
					</div>
				</Match>
			</Switch>

			<div class={/* @once */ dialog.actions()}>
				<button class={/* @once */ button({ color: 'primary' })}>Close</button>
			</div>
		</div>
	);
};

export default IdentifierHistoryDialog;

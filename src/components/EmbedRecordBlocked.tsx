import { Match, Switch } from 'solid-js';

import type { DID, UnionOf } from '@intrnl/bluesky-client/atp-schema';

import { getRecordId, getRepoId } from '~/api/utils.ts';

import { generatePath } from '~/router.ts';

import EmbedRecordNotFound from '~/components/EmbedRecordNotFound.tsx';

type EmbeddedBlockedRecord = UnionOf<'app.bsky.embed.record#viewBlocked'>;

export interface EmbedRecordBlockedProps {
	uid: DID;
	record: EmbeddedBlockedRecord;
}

const EmbedRecordBlocked = (props: EmbedRecordBlockedProps) => {
	const uid = () => props.uid;
	const record = () => props.record;

	return (
		<Switch>
			<Match when={record().author.viewer?.blocking}>
				<div class="flex items-stretch justify-between gap-3 overflow-hidden rounded-md border border-divider">
					<p class="m-3 text-sm text-muted-fg">Blocked post</p>

					<a
						link
						href={generatePath('/u/:uid/profile/:actor/post/:status', {
							uid: uid(),
							actor: getRepoId(record().uri),
							status: getRecordId(record().uri),
						})}
						class="flex items-center whitespace-nowrap px-4 text-sm font-medium hover:bg-secondary hover:text-hinted-fg"
					>
						View
					</a>
				</div>
			</Match>

			<Match when>
				<EmbedRecordNotFound />
			</Match>
		</Switch>
	);
};

export default EmbedRecordBlocked;

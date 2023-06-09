import type { DID, UnionOf } from '@intrnl/bluesky-client/atp-schema';

import { getRecordId, getRepoId } from '~/api/utils.ts';

import { A } from '~/router.ts';

type EmbeddedBlockedRecord = UnionOf<'app.bsky.embed.record#viewBlocked'>;

export interface EmbedRecordBlockedProps {
	uid: DID;
	record: EmbeddedBlockedRecord;
}

const EmbedRecordBlocked = (props: EmbedRecordBlockedProps) => {
	const uid = () => props.uid;
	const record = () => props.record;

	return (
		<div class="flex items-stretch justify-between gap-3 overflow-hidden rounded-md border border-divider">
			<p class="m-3 text-sm text-muted-fg">This post is from a user you blocked.</p>

			<A
				href="/u/:uid/profile/:actor/post/:status"
				params={{ uid: uid(), actor: getRepoId(record().uri), status: getRecordId(record().uri) }}
				class="flex items-center whitespace-nowrap px-4 text-sm font-medium hover:bg-secondary hover:text-hinted-fg"
			>
				View
			</A>
		</div>
	);
};

export default EmbedRecordBlocked;

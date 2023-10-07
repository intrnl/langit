import type { DID } from '@intrnl/bluesky-client/atp-schema';

import type { SignalizedFeedGenerator } from '~/api/cache/feed-generators.ts';

import { getRecordId } from '~/api/utils.ts';

import { closeModal, openModal } from '~/globals/modals.tsx';

import ReportDialog, { REPORT_FEED } from '~/components/dialogs/ReportDialog.tsx';
import * as menu from '~/styles/primitives/menu.ts';

import LaunchIcon from '~/icons/baseline-launch.tsx';
import ReportIcon from '~/icons/baseline-report';

export interface FeedMenuProps {
	uid: DID;
	feed: SignalizedFeedGenerator;
}

const FeedMenu = (props: FeedMenuProps) => {
	const uid = () => props.uid;
	const feed = () => props.feed;

	return (
		<div class={/* @once */ menu.content()}>
			<button
				onClick={() => {
					const $feed = feed();

					open(`https://bsky.app/profile/${$feed.creator.did}/feed/${getRecordId($feed.uri)}`, '_blank');
					closeModal();
				}}
				class={/* @once */ menu.item()}
			>
				<LaunchIcon class="text-lg" />
				<span>Open in Bluesky app</span>
			</button>

			<button
				onClick={() => {
					const $feed = feed();

					closeModal();
					openModal(() => (
						<ReportDialog uid={uid()} report={{ type: REPORT_FEED, uri: $feed.uri, cid: $feed.cid.value }} />
					));
				}}
				class={/* @once */ menu.item()}
			>
				<ReportIcon class="text-lg" />
				<span>Report list</span>
			</button>

			<button onClick={closeModal} class={/* @once */ menu.cancel()}>
				Cancel
			</button>
		</div>
	);
};

export default FeedMenu;

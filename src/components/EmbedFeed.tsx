import { Show } from 'solid-js';

import { type EmbeddedGeneratorRecord } from '~/api/types.ts';
import { type DID, getRecordId } from '~/api/utils.ts';

import { A } from '~/router.ts';

export interface EmbedFeedProps {
	uid: DID;
	feed: EmbeddedGeneratorRecord;
}

const EmbedFeed = (props: EmbedFeedProps) => {
	const uid = () => props.uid;
	const feed = () => props.feed;

	return (
		<A
			href="/u/:uid/profile/:actor/feed/:feed"
			params={{ uid: uid(), actor: feed().creator.did, feed: getRecordId(feed().uri) }}
			class="flex flex-col gap-2 rounded-md border border-divider p-3 text-sm hover:bg-secondary"
		>
			<div class="flex items-center gap-3">
				<div class="h-9 w-9 overflow-hidden rounded-md bg-muted-fg">
					<Show when={feed().avatar}>{(avatar) => <img src={avatar()} class="h-full w-full" />}</Show>
				</div>

				<div>
					<p class="font-bold">{feed().displayName}</p>
					<p class="text-muted-fg">Feed by @{feed().creator.handle}</p>
				</div>
			</div>

			<p class="text-muted-fg">Liked by {feed().likeCount || 0} users</p>
		</A>
	);
};

export default EmbedFeed;

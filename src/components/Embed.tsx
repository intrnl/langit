import { Match, Show, Switch, createMemo } from 'solid-js';

import {
	type BskyPost,
	type EmbeddedGeneratorRecord,
	type EmbeddedImage,
	type EmbeddedLink,
	type EmbeddedPostRecord,
} from '~/api/types.ts';
import { type DID } from '~/api/utils.ts';

import EmbedFeed from '~/components/EmbedFeed.tsx';
import EmbedImage from '~/components/EmbedImage.tsx';
import EmbedLink from '~/components/EmbedLink.tsx';
import EmbedRecord from '~/components/EmbedRecord.tsx';
import EmbedRecordNotFound from '~/components/EmbedRecordNotFound.tsx';

export interface EmbedProps {
	uid: DID;
	embed: NonNullable<BskyPost['embed']>;
	/** Whether it should show a large UI for certain embeds */
	large?: boolean;
}

const Embed = (props: EmbedProps) => {
	const uid = () => props.uid;

	const val = createMemo(() => {
		const embed = props.embed;
		const type = embed.$type;

		let images: EmbeddedImage[] | undefined;
		let link: EmbeddedLink | undefined;
		let post: EmbeddedPostRecord | false | undefined;
		let feed: EmbeddedGeneratorRecord | undefined;

		if (type === 'app.bsky.embed.external#view') {
			link = embed.external;
		} else if (type === 'app.bsky.embed.images#view') {
			images = embed.images;
		} else if (type === 'app.bsky.embed.record#view') {
			const rec = embed.record;
			const type = rec.$type;

			if (type === 'app.bsky.embed.record#viewRecord') {
				post = rec;
			} else if (type === 'app.bsky.feed.defs#generatorView') {
				feed = rec;
			} else {
				post = false;
			}
		} else if (type === 'app.bsky.embed.recordWithMedia#view') {
			const rec = embed.record.record;
			const type = rec.$type;

			const media = embed.media;
			const mediatype = media.$type;

			if (type === 'app.bsky.embed.record#viewRecord') {
				post = rec;
			} else if (type === 'app.bsky.feed.defs#generatorView') {
				feed = rec;
			} else {
				post = false;
			}

			if (mediatype === 'app.bsky.embed.external#view') {
				link = media.external;
			} else if (mediatype === 'app.bsky.embed.images#view') {
				images = media.images;
			}
		}

		return { images, link, post, feed };
	});

	return (
		<div class="mt-3 flex flex-col gap-3">
			<Show when={val().link}>{(link) => <EmbedLink link={link()} interactive />}</Show>

			<Show when={val().images}>{(images) => <EmbedImage images={images()} interactive />}</Show>

			<Switch>
				<Match when={val().post === false}>
					<EmbedRecordNotFound />
				</Match>
				<Match when={val().post}>
					{(record) => <EmbedRecord uid={uid()} record={record()} large={props.large} interactive />}
				</Match>

				<Match when={val().feed}>{(feed) => <EmbedFeed uid={uid()} feed={feed()} />}</Match>
			</Switch>
		</div>
	);
};

export default Embed;

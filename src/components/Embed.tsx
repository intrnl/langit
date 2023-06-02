import { Show, createMemo } from 'solid-js';

import {
	type BskyPost,
	type BskyPostEmbedRecord,
	type EmbeddedImage,
	type EmbeddedLink,
} from '~/api/types.ts';
import { type DID } from '~/api/utils.ts';

import EmbedFeed from '~/components/EmbedFeed.tsx';
import EmbedImage from '~/components/EmbedImage.tsx';
import EmbedLink from '~/components/EmbedLink.tsx';
import EmbedRecord from '~/components/EmbedRecord.tsx';
import EmbedRecordBlocked from '~/components/EmbedRecordBlocked.tsx';
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
		let record: BskyPostEmbedRecord['record'] | undefined;

		if (type === 'app.bsky.embed.external#view') {
			link = embed.external;
		} else if (type === 'app.bsky.embed.images#view') {
			images = embed.images;
		} else if (type === 'app.bsky.embed.record#view') {
			record = embed.record;
		} else if (type === 'app.bsky.embed.recordWithMedia#view') {
			const rec = embed.record.record;

			const media = embed.media;
			const mediatype = media.$type;

			record = rec;

			if (mediatype === 'app.bsky.embed.external#view') {
				link = media.external;
			} else if (mediatype === 'app.bsky.embed.images#view') {
				images = media.images;
			}
		}

		return { images, link, record };
	});

	return (
		<div class="mt-3 flex flex-col gap-3">
			<Show when={val().link}>{(link) => <EmbedLink link={link()} interactive />}</Show>

			<Show when={val().images}>{(images) => <EmbedImage images={images()} interactive />}</Show>

			<Show when={val().record} keyed>
				{(record) => {
					const type = record.$type;

					if (type === 'app.bsky.embed.record#viewNotFound') {
						return <EmbedRecordNotFound />;
					}

					if (type === 'app.bsky.embed.record#viewBlocked') {
						return <EmbedRecordBlocked uid={uid()} record={record} />;
					}

					if (type === 'app.bsky.embed.record#viewRecord') {
						return <EmbedRecord uid={uid()} record={record} large={props.large} interactive />;
					}

					if (type === 'app.bsky.feed.defs#generatorView') {
						return <EmbedFeed uid={uid()} feed={record} />;
					}

					return <></>;
				}}
			</Show>
		</div>
	);
};

export default Embed;

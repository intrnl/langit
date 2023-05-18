import { Match, Show, Switch, createMemo } from 'solid-js';

import {
	type BskyPost,
	type EmbeddedImage,
	type EmbeddedLink,
	type EmbeddedRecord,
} from '~/api/types.ts';

import EmbedImage from '~/components/EmbedImage.tsx';
import EmbedLink from '~/components/EmbedLink.tsx';
import EmbedRecord from '~/components/EmbedRecord.tsx';
import EmbedRecordNotFound from '~/components/EmbedRecordNotFound.tsx';

export interface EmbedProps {
	uid: string;
	embed: NonNullable<BskyPost['embed']>;
	/** Whether it should show a large UI for certain embeds */
	large?: boolean;
}

const Embed = (props: EmbedProps) => {
	const val = createMemo(() => {
		const embed = props.embed;
		const type = embed.$type;

		let images: EmbeddedImage[] | undefined;
		let link: EmbeddedLink | undefined;
		let record: EmbeddedRecord | false | undefined;

		if (type === 'app.bsky.embed.external#view') {
			link = embed.external;
		}
		else if (type === 'app.bsky.embed.images#view') {
			images = embed.images;
		}
		else if (type === 'app.bsky.embed.record#view') {
			const rec = embed.record;

			if (rec.$type === 'app.bsky.embed.record#viewRecord') {
				record = rec;
			}
			else {
				record = false;
			}
		}
		else if (type === 'app.bsky.embed.recordWithMedia#view') {
			const rec = embed.record.record;

			const media = embed.media;
			const mediatype = media.$type;

			if (rec.$type === 'app.bsky.embed.record#viewRecord') {
				record = rec;
			}
			else {
				record = false;
			}

			if (mediatype === 'app.bsky.embed.external#view') {
				link = media.external;
			}
			else if (mediatype === 'app.bsky.embed.images#view') {
				images = media.images;
			}
		}

		return { images, link, record };
	});

	return (
		<div class='flex flex-col gap-3 mt-3'>
			<Show when={val().link}>
				{(link) => <EmbedLink link={link()} />}
			</Show>

			<Show when={val().images}>
				{(images) => <EmbedImage images={images()} />}
			</Show>

			<Switch>
				<Match when={val().record === false}>
					<EmbedRecordNotFound />
				</Match>
				<Match when={val().record}>
					{(record) => <EmbedRecord uid={props.uid} record={record()} large={props.large} />}
				</Match>
			</Switch>
		</div>
	);
};

export default Embed;

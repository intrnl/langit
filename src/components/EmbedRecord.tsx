import { Show, createMemo } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import type { Records, UnionOf } from '@intrnl/bluesky-client/atp-schema';
import { A } from '@solidjs/router';

import { getRecordId } from '~/api/utils.ts';

import EmbedImage from '~/components/EmbedImage.tsx';

import * as relformat from '~/utils/intl/relformatter.ts';

type EmbeddedPostRecord = UnionOf<'app.bsky.embed.record#viewRecord'>;
type PostRecord = Records['app.bsky.feed.post'];

export interface EmbedRecordProps {
	uid: string;
	record: EmbeddedPostRecord;
	/** Whether it should show a large UI for image embeds */
	large?: boolean;
	interactive?: boolean;
}

const EmbedRecord = (props: EmbedRecordProps) => {
	const record = () => props.record;
	const large = () => props.large;
	const interactive = () => props.interactive;

	const author = () => record().author;
	const val = () => record().value;

	// we only show image embeds
	const images = createMemo(() => {
		const embeds = record().embeds;

		if (embeds && embeds.length > 0) {
			const val = embeds[0];

			if (val.$type === 'app.bsky.embed.images#view') {
				return val.images;
			} else if (val.$type === 'app.bsky.embed.recordWithMedia#view') {
				const media = val.media;

				if (media.$type === 'app.bsky.embed.images#view') {
					return media.images;
				}
			}
		}
	});

	return (
		<Dynamic
			component={interactive() ? A : 'div'}
			href={`/u/${props.uid}/profile/${author().did}/post/${getRecordId(record().uri)}`}
			class="overflow-hidden rounded-md border border-divider"
			classList={{ 'cursor-pointer hover:bg-secondary': interactive() }}
		>
			<div class="mx-3 mt-3 flex text-sm text-muted-fg">
				<div class="mr-1 h-5 w-5 shrink-0 overflow-hidden rounded-full bg-muted-fg">
					<Show when={author().avatar}>{(avatar) => <img src={avatar()} class="h-full w-full" />}</Show>
				</div>

				<span class="line-clamp-1 break-all font-bold text-primary group-hover:underline">
					{author().displayName}
				</span>
				<span class="ml-1 line-clamp-1 break-all">@{author().handle}</span>
				<span class="px-1">·</span>
				<span class="whitespace-nowrap">{relformat.format((val() as PostRecord).createdAt)}</span>
			</div>

			<Show when={(val() as PostRecord).text}>
				<div class="flex items-start">
					<Show when={!large() && images()}>
						<div class="mb-3 ml-3 mt-2 grow basis-0">
							<EmbedImage images={images()!} />
						</div>
					</Show>

					<div class="mx-3 mb-3 mt-1 min-w-0 grow-4 basis-0 whitespace-pre-wrap break-words text-sm empty:hidden">
						{(val() as PostRecord).text}
					</div>
				</div>
			</Show>

			<Show when={(large() || !(val() as PostRecord).text) && images()}>
				<Show when={!(val() as PostRecord).text}>
					<div class="mt-3" />
				</Show>

				<EmbedImage images={images()!} borderless />
			</Show>
		</Dynamic>
	);
};

export default EmbedRecord;

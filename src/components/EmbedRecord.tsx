import { Show, createMemo } from 'solid-js';

import { type EmbeddedPostRecord } from '~/api/types.ts';
import { getRecordId } from '~/api/utils.ts';

import { A } from '~/router';

import EmbedImage from '~/components/EmbedImage.tsx';

import * as relformat from '~/utils/intl/relformatter.ts';

export interface EmbedRecordProps {
	uid: string;
	record: EmbeddedPostRecord;
	/** Whether it should show a large UI for image embeds */
	large?: boolean;
}

const EmbedRecord = (props: EmbedRecordProps) => {
	const record = () => props.record;
	const author = () => record().author;
	const val = () => record().value;

	const large = () => props.large;

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
		<A
			href="/u/:uid/profile/:actor/post/:status"
			params={{ uid: props.uid, actor: author().did, status: getRecordId(record().uri) }}
			class="overflow-hidden rounded-md border border-divider hover:bg-secondary"
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
				<span class="whitespace-nowrap">{relformat.format(val().createdAt)}</span>
			</div>

			<Show when={val().text}>
				<div class="flex items-start">
					<Show when={!large() && images()}>
						<div class="mb-3 ml-3 mt-2 grow basis-0">
							<EmbedImage images={images()!} />
						</div>
					</Show>

					<div class="mx-3 mb-3 mt-1 min-w-0 grow-4 basis-0 whitespace-pre-wrap break-words text-sm empty:hidden">
						{val().text}
					</div>
				</div>
			</Show>

			<Show when={(large() || !val().text) && images()}>
				<Show when={!val().text}>
					<div class="mt-3" />
				</Show>

				<EmbedImage images={images()!} borderless />
			</Show>
		</A>
	);
};

export default EmbedRecord;

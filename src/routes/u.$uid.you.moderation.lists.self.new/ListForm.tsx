import { Show, createSignal } from 'solid-js';

import type { SignalizedList } from '~/api/cache/lists.ts';

import type { Facet } from '~/api/richtext/types.ts';

import { createId, model } from '~/utils/misc.ts';

import BlobImage from '~/components/BlobImage.tsx';
import AddPhotoButton from '~/components/AddPhotoButton.tsx';
import button from '~/styles/primitives/button.ts';
import input from '~/styles/primitives/input.ts';
import select from '~/styles/primitives/select.ts';
import textarea from '~/styles/primitives/textarea.ts';

export interface ListSubmissionData {
	avatar: Blob | string | undefined;
	name: string;
	purpose: string;
	description: string | undefined;
	descriptionFacets: Facet[] | undefined;
}

export interface ListFormProps {
	disabled?: boolean;
	initialData?: SignalizedList;
	onSubmit: (next: ListSubmissionData) => void;
	onDelete?: () => void;
}

const enum ListType {
	MODERATION = 'app.bsky.graph.defs#modlist',
	CURATION = 'app.bsky.graph.defs#curatelist',
}

const ListForm = (props: ListFormProps) => {
	const init = props.initialData;

	const id = createId();

	const [avatar, setAvatar] = createSignal<Blob | string | undefined>(init ? init.avatar.value : undefined);
	const [name, setName] = createSignal((init && init.name.peek()) || '');
	const [desc, setDesc] = createSignal((init && init.description.peek()) || '');
	const [type, setType] = createSignal(init ? init.purpose.peek() : ListType.CURATION);

	const handleSubmit = (ev: SubmitEvent) => {
		ev.preventDefault();

		props.onSubmit({
			avatar: avatar(),
			name: name(),
			purpose: type(),
			description: desc(),
			descriptionFacets: undefined,
		});
	};

	return (
		<form onSubmit={handleSubmit} class="flex flex-col gap-4 p-4">
			<fieldset disabled={props.disabled} class="contents">
				<div class="flex flex-col gap-2">
					<label class="block text-sm font-medium leading-6 text-primary">List image</label>

					<div class="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted-fg">
						<Show when={avatar()} keyed>
							{(avatar) => <BlobImage src={avatar} class="h-full w-full object-cover" />}
						</Show>

						<AddPhotoButton
							exists={!!avatar()}
							title="Add list image"
							aspectRatio={1 / 1}
							maxWidth={1000}
							maxHeight={1000}
							onPick={setAvatar}
						/>
					</div>
				</div>

				<div class="flex flex-col gap-2">
					<label for={'type' + id} class="block text-sm font-medium leading-6 text-primary">
						List purpose
					</label>

					<select
						id={'type' + id}
						class={/* @once */ select()}
						value={type()}
						onChange={(ev) => setType(ev.currentTarget.value)}
					>
						<option value={ListType.MODERATION}>Moderation list</option>
						<option value={ListType.CURATION}>Curation list</option>
					</select>
				</div>

				<div class="flex flex-col gap-2">
					<label for={'name' + id} class="block text-sm font-medium leading-6 text-primary">
						List name
					</label>
					<input
						ref={model(name, setName)}
						type="text"
						id={'name' + id}
						required
						class={/* @once */ input()}
					/>
				</div>

				<div class="flex flex-col gap-2">
					<label for={'desc' + id} class="block text-sm font-medium leading-6 text-primary">
						List description (optional)
					</label>
					<textarea ref={model(desc, setDesc)} id={'desc' + id} rows={5} class={/* @once */ textarea()} />
				</div>

				<hr class="border-divider" />

				<div class="flex justify-end">
					<button type="submit" class={/* @once */ button({ color: 'primary' })}>
						Save
					</button>
				</div>
			</fieldset>
		</form>
	);
};

export default ListForm;

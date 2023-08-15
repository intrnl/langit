import { createSignal } from 'solid-js';
import type { JSX } from 'solid-js/jsx-runtime';

import { closeModal } from '~/globals/modals.tsx';

import button from '~/styles/primitives/button.ts';
import * as dialog from '~/styles/primitives/dialog.ts';
import * as menu from '~/styles/primitives/menu.ts';

import CheckIcon from '~/icons/baseline-check.tsx';

// import type { ComposedImage } from './types.ts';

const LABEL_OPTIONS = [
	{
		id: 'sexual',
		name: 'Sexually suggestive',
		desc: 'Not pornographic but still sexual in nature',
	},
	{
		id: 'nudity',
		name: 'Nudity',
		desc: 'Artistic or non-erotic nudity',
	},
	{
		id: 'porn',
		name: 'Pornography',
		desc: 'Erotic nudity or explicit sexual activity',
	},
];

export interface AddSelfLabelDialogProps {
	// TODO: since the self-labeling is only used to mark media as sensitive,
	// we'll eventually have to move the image check to inside the dialog itself,
	// so that it can be used to label text content as well.
	// images: ComposedImage[];
	labels: string[];
	onApply: (next: string[]) => void;
}

// NOTE: there's only self-labeling for adult content at the moment
// there are 3 adult labels, and only one can be used at a time.
const AddSelfLabelDialog = (props: AddSelfLabelDialogProps) => {
	const [labels, setLabels] = createSignal(props.labels);

	const toggleLabel = (label: string) => {
		// const $labels = labels().slice();
		// const index = $labels.indexOf(label);
		// if (index !== -1) {
		// 	$labels.splice(index, 1);
		// } else {
		// 	$labels.push(label);
		// }
		// setLabels($labels);

		setLabels([label]);
	};

	const renderOptions = () => {
		const nodes: JSX.Element[] = [];

		nodes.push(
			<button
				onClick={() => setLabels([])}
				class={/* @once */ menu.item()}
				classList={{ 'group is-active': labels().length === 0 }}
			>
				<div class="grow">
					<p>None</p>
					<p class="text-muted-fg">Don't label this content</p>
				</div>
				<CheckIcon class="hidden text-xl text-accent group-[.is-active]:block" />
			</button>,
		);

		for (const option of LABEL_OPTIONS) {
			nodes.push(
				<button
					onClick={() => toggleLabel(option.id)}
					class={/* @once */ menu.item()}
					classList={{ 'group is-active': labels().includes(option.id) }}
				>
					<div class="grow">
						<p>{option.name}</p>
						<p class="text-muted-fg">{option.desc}</p>
					</div>
					<CheckIcon class="hidden text-xl text-accent group-[.is-active]:block" />
				</button>,
			);
		}

		return nodes;
	};

	return (
		<div class={/* @once */ dialog.content()}>
			<h1 class={/* @once */ dialog.title()}>Add content warning</h1>

			<div class="-mx-4 mt-3 flex flex-col">{renderOptions()}</div>

			<div class={/* @once */ dialog.actions()}>
				<button onClick={closeModal} class={/* @once */ button({ color: 'ghost' })}>
					Cancel
				</button>
				<button
					onClick={() => {
						closeModal();
						props.onApply(labels());
					}}
					class={/* @once */ button({ color: 'primary' })}
				>
					Confirm
				</button>
			</div>
		</div>
	);
};

export default AddSelfLabelDialog;

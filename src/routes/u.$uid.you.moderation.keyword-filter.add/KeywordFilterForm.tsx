import { type Accessor, type Signal, For, createSignal, createRenderEffect } from 'solid-js';

import { type KeywordPreference } from '~/api/moderation/enums.ts';
import type { ModerationFiltersOpts } from '~/api/moderation/types.ts';

import { createId, model, modelChecked } from '~/utils/misc.ts';

import button from '~/styles/primitives/button.ts';
import input from '~/styles/primitives/input.ts';

import DeleteIcon from '~/icons/baseline-delete.tsx';
import AddIcon from '~/icons/baseline-add';

interface PartialFilterOpts {
	name: ModerationFiltersOpts['name'];
	pref: ModerationFiltersOpts['pref'];
	matchers: ModerationFiltersOpts['matchers'];
}

export interface KeywordFilterFormProps {
	initialData?: ModerationFiltersOpts;
	onSubmit?: (next: PartialFilterOpts) => void;
}

type KeywordState = [keyword: Signal<string>, whole: Signal<boolean>];

const createKeywordState = (keyword: string, whole: boolean): KeywordState => {
	return [createSignal(keyword), createSignal(whole)];
};

const modelRadio = (value: string, getter: Accessor<string>, setter: (next: string) => void) => {
	return (node: HTMLInputElement) => {
		createRenderEffect(() => {
			node.checked = getter() === value;
		});

		node.addEventListener('input', () => {
			setter(value);
		});
	};
};

const KeywordFilterForm = (props: KeywordFilterFormProps) => {
	const initialData = props.initialData;

	const id = createId();

	const [name, setName] = createSignal(initialData ? initialData.name : '');
	const [pref, setPref] = createSignal(initialData ? '' + initialData.pref : '2');

	const [matchers, setMatchers] = createSignal<KeywordState[]>(
		initialData
			? initialData.matchers.map((m) => createKeywordState(m[0], m[1]))
			: [createKeywordState('', true)],
	);

	const handleSubmit = (ev: SubmitEvent) => {
		ev.preventDefault();

		props.onSubmit?.({
			name: name(),
			pref: +pref() as KeywordPreference,
			matchers: matchers().map(([keywordState, wholeState]) => [keywordState[0](), wholeState[0]()]),
		});
	};

	return (
		<form onSubmit={handleSubmit} class="flex flex-col gap-4 p-4">
			<div class="flex flex-col gap-2">
				<label for={'name' + id} class="block text-sm font-medium leading-6 text-primary">
					Filter name
				</label>
				<input ref={model(name, setName)} type="text" id={'name' + id} required class={/* @once */ input()} />
			</div>

			<div class="flex flex-col gap-2 text-sm">
				<legend class="block text-sm font-medium leading-6 text-primary">Filter preference</legend>

				<div class="flex gap-2">
					<input
						ref={modelRadio('1', pref, setPref)}
						type="radio"
						id={'pref1' + id}
						name={'pref' + id}
						required
					/>
					<label for={'pref1' + id}>Disable filter for now</label>
				</div>

				<div class="flex gap-2">
					<input
						ref={modelRadio('2', pref, setPref)}
						type="radio"
						id={'pref2' + id}
						name={'pref' + id}
						required
					/>
					<label for={'pref2' + id}>Hide posts behind a warning</label>
				</div>

				<div class="flex gap-2">
					<input
						ref={modelRadio('3', pref, setPref)}
						type="radio"
						id={'pref3' + id}
						name={'pref' + id}
						required
					/>
					<label for={'pref3' + id}>Hide posts completely</label>
				</div>
			</div>

			<div class="flex flex-col gap-2">
				<label class="block text-sm font-medium leading-6 text-primary">Keywords</label>

				<table
					class="text-sm"
					style={{
						'border-spacing': '16px 8px',
						'border-collapse': 'separate',
						margin: '-8px -16px',
					}}
				>
					<thead class="text-left font-medium text-muted-fg">
						<tr>
							<th class="w-full">Keyword or phrase</th>
							<th class="whitespace-nowrap">Whole word</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						<For
							each={matchers()}
							fallback={
								<tr>
									<td colspan={3} class="h-10">
										No keyword added
									</td>
								</tr>
							}
						>
							{([[keyword, setKeyword], [whole, setWhole]], index) => (
								<tr>
									<td class="h-10">
										<input
											ref={model(keyword, setKeyword)}
											type="text"
											required
											class={/* @once */ input()}
										/>
									</td>
									<td>
										<input ref={modelChecked(whole, setWhole)} type="checkbox" />
									</td>
									<td>
										<button
											type="button"
											title="Remove keyword"
											onClick={() => {
												const $matchers = matchers().slice();
												$matchers.splice(index(), 1);

												setMatchers($matchers);
											}}
											class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg hover:bg-secondary"
										>
											<DeleteIcon />
										</button>
									</td>
								</tr>
							)}
						</For>
					</tbody>
					<tfoot>
						<tr>
							<td colspan={3}>
								<button
									type="button"
									onClick={() => {
										setMatchers([...matchers(), createKeywordState('', true)]);
									}}
									class={/* @once */ button({ color: 'ghost' })}
								>
									<AddIcon class="-ml-1 mr-2" />
									<span>Add new keyword</span>
								</button>
							</td>
						</tr>
					</tfoot>
				</table>
			</div>

			<hr class="border-divider" />

			<div class="flex justify-end">
				<button class={/* @once */ button({ color: 'primary' })}>Save</button>
			</div>
		</form>
	);
};

export default KeywordFilterForm;

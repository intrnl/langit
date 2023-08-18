import { type ComponentProps, For, createMemo, Show } from 'solid-js';

import type { DID } from '@intrnl/bluesky-client/atp-schema';

import { systemLanguages } from '~/globals/platform.ts';
import { getAccountPreferences } from '~/globals/preferences.ts';
import { useParams } from '~/router.ts';
import { languageNames } from '~/utils/intl/displaynames.ts';

import LanguagePicker from '~/components/pickers/LanguagePicker';
import { openModal } from '~/globals/modals';
import AddIcon from '~/icons/baseline-add.tsx';
import CheckBoxOutlineBlankIcon from '~/icons/baseline-check-box-outline-blank.tsx';
import CheckBoxIcon from '~/icons/baseline-check-box.tsx';
import DeleteIcon from '~/icons/baseline-delete.tsx';

const Checkbox = (props: ComponentProps<'input'>) => {
	return (
		<label class="relative inline-flex  cursor-pointer text-xl">
			<input {...props} type="checkbox" class="peer h-0 w-0 appearance-none leading-none" />

			<div class="pointer-events-none absolute -inset-1.5 rounded-full peer-hover:bg-hinted peer-focus-visible:bg-hinted" />

			<CheckBoxOutlineBlankIcon class="z-10 text-muted-fg peer-checked:hidden peer-disabled:opacity-50" />
			<CheckBoxIcon class="z-10 hidden text-accent peer-checked:block peer-disabled:opacity-50" />
		</label>
	);
};

const AuthenticatedLanguagesSettingsPage = () => {
	const params = useParams('/u/:uid/settings/languages');

	const uid = () => params.uid as DID;

	const prefs = createMemo(() => {
		return getAccountPreferences(uid());
	});

	return (
		<div class="flex flex-col">
			<div class="sticky top-0 z-20 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Languages</p>
			</div>

			<button
				onClick={() => {
					openModal(() => (
						<LanguagePicker
							post
							onPick={(next) => {
								prefs().cl_defaultLanguage = next;
							}}
						/>
					));
				}}
				class="mt-2 px-4 py-3 text-left hover:bg-hinted"
			>
				<p class="text-sm">Default post language</p>

				<p class="pt-1 text-[0.8125rem] text-muted-fg">
					{(() => {
						const pref = prefs().cl_defaultLanguage ?? 'system';

						if (pref === 'none') {
							return `None`;
						} else if (pref === 'system') {
							return `Primary system language (${languageNames.of(systemLanguages[0])})`;
						} else {
							return languageNames.of(pref);
						}
					})()}
				</p>
			</button>

			<hr class="mt-2 border-divider" />

			<p class="p-4 text-base font-bold leading-5">Content languages</p>

			<p class="px-4 pb-3 text-[0.8125rem] text-muted-fg">
				Controls which languages appears in your feeds, this does not apply to your following feed. Removing
				all languages reveals posts from all languages.
			</p>

			<div class="px-4 py-3">
				<label class="flex justify-between gap-4">
					<span class="text-sm">Show unspecified posts</span>
					<Checkbox
						checked={prefs().cl_unspecified ?? true}
						onChange={(ev) => {
							const next = ev.target.checked;
							prefs().cl_unspecified = next;
						}}
					/>
				</label>

				<p class="mr-5 pt-1 text-[0.8125rem] text-muted-fg">
					Do not filter posts that does not specify a language.
				</p>
			</div>

			<div class="px-4 py-3">
				<label class="flex justify-between gap-4">
					<span class="text-sm">Use system languages</span>
					<Checkbox
						checked={prefs().cl_systemLanguage ?? true}
						onChange={(ev) => {
							const next = ev.target.checked;
							prefs().cl_systemLanguage = next;
						}}
					/>
				</label>

				<p class="mr-6 pt-1 text-[0.8125rem] text-muted-fg">
					Use the languages detected from your system or browser preferences
				</p>
			</div>

			<p class="px-4 pb-2 pt-4 text-sm font-medium leading-6 text-muted-fg">
				Show me posts with these languages
			</p>

			<For each={(prefs().cl_systemLanguage ?? true) && systemLanguages}>
				{(code) => <div class="items-center gap-4 px-4 py-3 text-sm">{languageNames.of(code)}</div>}
			</For>

			<For
				each={prefs().cl_codes}
				fallback={
					<Show when={!(prefs().cl_systemLanguage ?? true)}>
						<div class="flex items-center gap-4 px-4 py-3 text-sm">No languages added</div>
					</Show>
				}
			>
				{(code, idx) => (
					<div class="flex items-center gap-4 px-4 py-3 text-sm">
						<span class="grow">{languageNames.of(code)}</span>

						<button
							title="Remove language"
							onClick={() => {
								const $prefs = prefs();
								const arr = $prefs.cl_codes!;

								arr.splice(idx(), 1);

								if (arr.length === 0) {
									$prefs.cl_codes = undefined;
								}
							}}
							class="-my-1 -mr-1.5 flex h-8 w-8 items-center justify-center rounded-full text-xl text-muted-fg hover:bg-hinted"
						>
							<DeleteIcon />
						</button>
					</div>
				)}
			</For>

			<button
				onClick={() => {
					const $prefs = prefs();

					let codes = $prefs.cl_codes;
					if ($prefs.cl_systemLanguage ?? true) {
						codes = codes ? codes.concat(systemLanguages) : systemLanguages;
					}

					openModal(() => (
						<LanguagePicker
							exclude={codes || []}
							onPick={(next) => {
								const arr = $prefs.cl_codes;

								if (arr) {
									arr.push(next);
								} else {
									$prefs.cl_codes = [next];
								}
							}}
						/>
					));
				}}
				class="flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted"
			>
				<AddIcon class="text-2xl" />
				<span>Add language</span>
			</button>

			<hr class="mt-2 border-divider" />

			<p class="p-4 text-base font-bold leading-5">Post translations</p>

			<p class="px-4 pb-1 text-[0.8125rem] text-muted-fg">
				Offers to translate posts into your preferred language.
			</p>

			<button
				onClick={() => {
					openModal(() => (
						<LanguagePicker
							post
							onPick={(next) => {
								prefs().ct_language = next;
							}}
						/>
					));
				}}
				class="mt-2 px-4 py-3 text-left hover:bg-hinted"
			>
				<p class="text-sm">Preferred post language</p>

				<p class="pt-1 text-[0.8125rem] text-muted-fg">
					{(() => {
						const pref = prefs().ct_language ?? 'system';

						if (pref === 'none') {
							return `Disabled (None)`;
						} else if (pref === 'system') {
							return `Primary system language (${languageNames.of(systemLanguages[0])})`;
						} else {
							return languageNames.of(pref);
						}
					})()}
				</p>
			</button>

			<p class="px-4 pb-2 pt-4 text-sm font-medium leading-6 text-muted-fg">
				Never offer to translate these languages
			</p>

			<For
				each={prefs().ct_exclusions}
				fallback={<div class="flex items-center gap-4 px-4 py-3 text-sm">No languages added</div>}
			>
				{(code, idx) => (
					<div class="flex items-center gap-4 px-4 py-3 text-sm">
						<span class="grow">{languageNames.of(code)}</span>

						<button
							title="Remove language"
							onClick={() => {
								const $prefs = prefs();
								const arr = $prefs.ct_exclusions!;

								arr.splice(idx(), 1);

								if (arr.length === 0) {
									$prefs.ct_exclusions = undefined;
								}
							}}
							class="-my-1 -mr-1.5 flex h-8 w-8 items-center justify-center rounded-full text-xl text-muted-fg hover:bg-hinted"
						>
							<DeleteIcon />
						</button>
					</div>
				)}
			</For>

			<button
				onClick={() => {
					const $prefs = prefs();
					const exclusions = $prefs.ct_exclusions;

					openModal(() => (
						<LanguagePicker
							exclude={exclusions || []}
							onPick={(next) => {
								if (exclusions) {
									exclusions.push(next);
								} else {
									$prefs.ct_exclusions = [next];
								}
							}}
						/>
					));
				}}
				class="mb-4 flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted"
			>
				<AddIcon class="text-2xl" />
				<span>Add language</span>
			</button>
		</div>
	);
};

export default AuthenticatedLanguagesSettingsPage;

import { For, type ComponentProps } from 'solid-js';

import { type DID } from '~/api/utils.ts';

import { useParams } from '~/router.ts';
import { systemLanguages } from '~/globals/platform.ts';
import { preferences } from '~/globals/preferences.ts';
import { languageNames } from '~/utils/intl/displaynames.ts';

import AddIcon from '~/icons/baseline-add.tsx';
import CheckBoxIcon from '~/icons/baseline-check-box.tsx';
import CheckBoxOutlineBlankIcon from '~/icons/baseline-check-box-outline-blank.tsx';
import DeleteIcon from '~/icons/baseline-delete.tsx';
import { openModal } from '~/globals/modals';
import LanguagePicker from '~/components/pickers/LanguagePicker';

const Checkbox = (props: ComponentProps<'input'>) => {
	return (
		<label class="relative inline-flex  cursor-pointer text-xl">
			<input {...props} type="checkbox" class="peer h-0 w-0 appearance-none leading-none" />

			<div class="pointer-events-none absolute -inset-1.5 rounded-full peer-hover:bg-hinted" />

			<CheckBoxOutlineBlankIcon class="z-10 text-muted-fg peer-checked:hidden peer-disabled:opacity-50" />
			<CheckBoxIcon class="z-10 hidden text-accent peer-checked:block peer-disabled:opacity-50" />
		</label>
	);
};

const AuthenticatedLanguagesSettingsPage = () => {
	const params = useParams('/u/:uid/settings/content-languages');

	const uid = () => params.uid as DID;

	return (
		<div class="flex flex-col">
			<div class="sticky top-0 z-10 flex h-13 items-center border-b border-divider bg-background px-4">
				<p class="text-base font-bold">Content languages</p>
			</div>

			<p class="px-4 py-3 text-[0.8125rem] text-muted-fg">
				Controls which languages appears in your feeds, this does not apply to your following feed. Removing
				all languages reveals posts from all languages.
			</p>

			<For each={preferences.get(uid())?.cl_codes}>
				{(code, idx) => (
					<div class="flex items-center gap-4 px-4 py-3 text-sm">
						<span class="grow">{languageNames.of(code)}</span>

						<button
							title="Remove language"
							onClick={() => {
								const next = preferences.get(uid())!.cl_codes!.slice();
								next.splice(idx(), 1);

								preferences.merge(uid(), { cl_codes: next });
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
					openModal(() => (
						<LanguagePicker
							onPick={(next) => {
								const array = preferences.get(uid())?.cl_codes || [];
								preferences.merge(uid(), { cl_codes: array.concat(next) });
							}}
						/>
					));
				}}
				class="flex items-center gap-4 px-4 py-3 text-sm hover:bg-hinted"
			>
				<AddIcon class="text-2xl" />
				<span>Add language</span>
			</button>

			<div class="px-4 py-3">
				<label class="flex justify-between gap-4">
					<span class="text-sm">Use system languages</span>
					<Checkbox
						checked={preferences.get(uid())?.cl_systemLanguage ?? true}
						onChange={(ev) => {
							const next = ev.target.checked;
							preferences.merge(uid(), { cl_systemLanguage: next });
						}}
					/>
				</label>

				<p class="pt-1 text-[0.8125rem] text-muted-fg">
					Detected languages: {systemLanguages.map((code) => languageNames.of(code)).join(', ')}
				</p>
			</div>

			<hr class="my-2 border-divider" />

			<div class="px-4 py-3">
				<label class="flex justify-between gap-4">
					<span class="text-sm">Show unspecified posts</span>
					<Checkbox
						disabled
						checked={preferences.get(uid())?.cl_unspecified ?? true}
						onChange={(ev) => {
							const next = ev.target.checked;
							preferences.merge(uid(), { cl_unspecified: next });
						}}
					/>
				</label>

				<p class="pt-1 text-[0.8125rem] text-muted-fg">
					Show posts that does not explicitly specify a language
				</p>
			</div>

			<button
				onClick={() => {
					openModal(() => (
						<LanguagePicker
							post
							onPick={(next) => {
								preferences.merge(uid(), { cl_defaultLanguage: next });
							}}
						/>
					));
				}}
				class="px-4 py-3 text-left hover:bg-hinted"
			>
				<p class="text-sm">Default post language</p>

				<p class="pt-1 text-[0.8125rem] text-muted-fg">
					{(() => {
						const pref = preferences.get(uid())?.cl_defaultLanguage ?? 'system';

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
		</div>
	);
};

export default AuthenticatedLanguagesSettingsPage;

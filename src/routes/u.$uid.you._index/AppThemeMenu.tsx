import { createMemo } from 'solid-js';

import { closeModal } from '~/globals/modals.tsx';
import { type LocalSettings, preferences } from '~/globals/preferences.ts';

import * as menu from '~/styles/primitives/menu.ts';

import CheckIcon from '~/icons/baseline-check.tsx';

const AppThemeMenu = () => {
	const prefs = createMemo(() => {
		preferences.local ||= {};
		return preferences.local;
	});

	const theme = createMemo(() => {
		const $prefs = prefs();
		return $prefs.theme ?? 'auto';
	});

	const setTheme = (next: NonNullable<LocalSettings['theme']>) => {
		const $prefs = prefs();
		$prefs.theme = next;
	};

	return (
		<div class={/* @once */ menu.content()}>
			<h1 class={/* @once */ menu.title()}>Application theme</h1>

			<button
				onClick={() => setTheme('light')}
				class={/* @once */ menu.item()}
				classList={{ 'group is-active': theme() === 'light' }}
			>
				<span class="grow">Light theme</span>
				<CheckIcon class="hidden text-xl text-accent group-[.is-active]:block" />
			</button>
			<button
				onClick={() => setTheme('dark')}
				class={/* @once */ menu.item()}
				classList={{ 'group is-active': theme() === 'dark' }}
			>
				<span class="grow">Dark theme</span>
				<CheckIcon class="hidden text-xl text-accent group-[.is-active]:block" />
			</button>
			<button
				onClick={() => setTheme('auto')}
				class={/* @once */ menu.item()}
				classList={{ 'group is-active': theme() === 'auto' }}
			>
				<span class="grow">Automatic</span>
				<CheckIcon class="hidden text-xl text-accent group-[.is-active]:block" />
			</button>

			<button onClick={closeModal} class={/* @once */ menu.cancel()}>
				Cancel
			</button>
		</div>
	);
};

export default AppThemeMenu;

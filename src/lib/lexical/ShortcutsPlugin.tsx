import { onCleanup } from 'solid-js';

import { COMMAND_PRIORITY_NORMAL, DROP_COMMAND, type PasteCommandType } from 'lexical';
import { KEY_ENTER_COMMAND, PASTE_COMMAND } from 'lexical';

import { useLexicalComposerContext } from 'lexical-solid/LexicalComposerContext';

export interface ShortcutsPluginProps {
	onSubmit: () => void;
	onImageDrop: (images: Blob[]) => void;
}

const ShortcutsPlugin = (props: ShortcutsPluginProps) => {
	const [editor] = useLexicalComposerContext();

	onCleanup(
		editor.registerCommand(
			KEY_ENTER_COMMAND,
			(event: KeyboardEvent | null) => {
				if (event && event.ctrlKey) {
					props.onSubmit();

					return true;
				}

				return false;
			},
			COMMAND_PRIORITY_NORMAL,
		),
	);

	onCleanup(
		editor.registerCommand(
			PASTE_COMMAND,
			(event: PasteCommandType) => {
				if (event instanceof ClipboardEvent) {
					const items = event.clipboardData?.items ?? [];
					let images: Blob[] = [];

					for (let idx = 0, len = items.length; idx < len; idx++) {
						const item = items[idx];

						if (item.kind === 'file' && item.type.startsWith('image/')) {
							const blob = item.getAsFile();

							if (blob) {
								images.push(blob);
							}
						}
					}

					if (images.length > 0) {
						props.onImageDrop(images);
						return true;
					}
				}

				return false;
			},
			COMMAND_PRIORITY_NORMAL,
		),
	);

	onCleanup(
		editor.registerCommand(
			DROP_COMMAND,
			(event: DragEvent) => {
				const data = event.dataTransfer;

				if (data) {
					const files = data.files;
					let images: Blob[] = [];

					for (let idx = 0, len = files.length; idx < len; idx++) {
						const file = files[idx];

						if (file.type.startsWith('image/')) {
							images.push(file);
						}
					}

					if (images.length > 0) {
						props.onImageDrop(images);
						return true;
					}
				}

				return false;
			},
			COMMAND_PRIORITY_NORMAL,
		),
	);

	return null;
};

export default ShortcutsPlugin;

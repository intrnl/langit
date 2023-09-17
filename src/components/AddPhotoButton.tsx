import { Show, createSignal } from 'solid-js';

import { openModal } from '~/globals/modals.tsx';
import { compressProfileImage } from '~/utils/image.ts';

import PhotoPickerMenu from '~/components/menus/PhotoPickerMenu.tsx';
import CircularProgress from '~/components/CircularProgress.tsx';

import AddPhotoAlternateIcon from '~/icons/baseline-add-photo-alternate.tsx';

import ImageUploadCompressDialog from '~/routes/u.$uid.compose/ImageUploadCompressDialog.tsx';

export interface AddPhotoButtonProps {
	exists: boolean;
	title: string;
	aspectRatio: number;
	maxWidth: number;
	maxHeight: number;
	onPick: (blob: Blob | undefined) => void;
}

const AddPhotoButton = (props: AddPhotoButtonProps) => {
	let input: HTMLInputElement | undefined;

	const [loading, setLoading] = createSignal(false);

	const processBlob = async (file: File) => {
		if (loading()) {
			return;
		}

		setLoading(true);

		try {
			const { aspectRatio, maxWidth, maxHeight } = props;
			const result = await compressProfileImage(file, aspectRatio, maxWidth, maxHeight);

			if (result.before !== result.after) {
				openModal(() => (
					<ImageUploadCompressDialog
						images={[{ ...result, name: file.name }]}
						onSubmit={() => props.onPick(result.blob)}
					/>
				));
			} else {
				props.onPick(file);
			}
		} catch {}

		setLoading(false);
	};

	const clearPhoto = () => {
		props.onPick(undefined);
	};

	const openFileInput = () => {
		input!.click();
	};

	const handleClick = () => {
		if (props.exists) {
			openModal(() => <PhotoPickerMenu onChoose={openFileInput} onClear={clearPhoto} />);
		} else {
			openFileInput();
		}
	};

	const handleFileInput = (ev: Event & { currentTarget: HTMLInputElement }) => {
		const target = ev.currentTarget;
		const files = Array.from(target.files!);

		target.value = '';

		if (files.length > 0) {
			processBlob(files[0]);
		}
	};

	return (
		<>
			<Show
				when={!loading()}
				fallback={
					<div class="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/75">
						<CircularProgress />
					</div>
				}
			>
				<button
					title={props.title}
					onClick={handleClick}
					class="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 outline-2 outline-primary hover:bg-secondary focus-visible:outline"
				>
					<AddPhotoAlternateIcon class="text-xl" />
				</button>
			</Show>

			<input ref={input} type="file" class="hidden" accept="image/*" onChange={handleFileInput} />
		</>
	);
};

export default AddPhotoButton;

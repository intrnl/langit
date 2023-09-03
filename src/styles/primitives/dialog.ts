export interface DialogContentProps {
	class?: string;
}

export const content = (props: DialogContentProps = {}) => {
	const { class: className } = props;

	let cn = `flex w-full max-w-md max-h-[80%] flex-col overflow-hidden rounded-t-md bg-background p-4 pb-6 align-middle shadow-xl sm:rounded-md sm:pb-4`;

	if (className) {
		return `${cn} ${className}`;
	} else {
		return cn;
	}
};

export const title = () => {
	return 'text-base font-bold break-words shrink-0';
};

export const actions = () => {
	return 'mt-3 flex justify-end gap-3 shrink-0';
};

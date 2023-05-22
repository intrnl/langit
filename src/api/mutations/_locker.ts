const locked = new WeakMap<any, boolean>();

export const acquire = async (value: any, callback: () => Promise<void>) => {
	if (locked.has(value)) {
		return;
	}

	locked.set(value, true);

	try {
		const result = await callback();
		return result;
	}
	finally {
		locked.delete(value);
	}
};

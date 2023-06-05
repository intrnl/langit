const locked = new WeakSet<any>();

export const acquire = async (value: any, callback: () => Promise<void>) => {
	if (locked.has(value)) {
		return;
	}

	locked.add(value);

	try {
		const result = await callback();
		return result;
	} finally {
		locked.delete(value);
	}
};

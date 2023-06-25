interface Deferred<T> {
	resolve(value: T | PromiseLike<T>): void;
	reject(reason?: any): void;
}

interface LockHandle<T> {
	value: T;
	release(): void;
}

export class Locker<T> {
	#locked: boolean = false;
	#pending: Deferred<LockHandle<T>>[] = [];

	#handle: LockHandle<T>;
	#value: T;

	constructor(value: T) {
		const that = this;
		this.#value = value;

		const handle = (this.#handle = {
			get value() {
				return that.#value;
			},
			release() {
				const next = that.#pending.shift();

				if (next) {
					next.resolve(handle);
				} else {
					that.#locked = false;
				}
			},
		});
	}

	acquire(): Promise<LockHandle<T>> {
		return new Promise((resolve, reject) => {
			if (this.#locked) {
				this.#pending.push({ resolve, reject });
			} else {
				this.#locked = true;
				resolve(this.#handle);
			}
		});
	}
}

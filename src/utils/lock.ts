interface Deferred<T> {
	resolve(value: T | PromiseLike<T>): void;
	reject(reason?: any): void;
}

interface LockHandle<T> {
	value: T;
	release(): void;
}

export class Locker<T> {
	private locked: boolean = false;
	private pending: Deferred<LockHandle<T>>[] = [];

	private handle: LockHandle<T>;

	constructor (private value: T) {
		const that = this;

		const handle = this.handle = {
			get value () {
				return that.value;
			},
			release () {
				const next = that.pending.shift();

				if (next) {
					next.resolve(handle);
				}
				else {
					that.locked = false;
				}
			},
		};
	}

	public acquire (): Promise<LockHandle<T>> {
		return new Promise((resolve, reject) => {
			if (this.locked) {
				this.pending.push({ resolve, reject });
			}
			else {
				this.locked = true;
				resolve(this.handle);
			}
		});
	}
}

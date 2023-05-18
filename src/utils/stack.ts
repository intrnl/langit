interface StackNode<T> {
	v: T;
	n?: StackNode<T>;
}

export class Stack<T> {
	private n?: StackNode<T>;

	push (value: T) {
		this.n = { v: value, n: this.n };
	}

	pop (): T | undefined {
		const node = this.n;

		if (node) {
			this.n = node.n;
			return node.v;
		}
	}
}

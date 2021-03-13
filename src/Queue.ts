/* eslint-disable @typescript-eslint/no-non-null-assertion */

interface Node<T> {
  next?: Node<T>;
  value: T;
}

export default class<T> {
  public size = 0;

  private head?: Node<T>;
  private tail?: Node<T>;

  public dequeue(): T | null {
    if (this.size === 0) {
      return null;
    }

    if (this.size === 1) {
      this.tail = undefined;
    }

    const node = this.head!;
    this.head = node.next;
    this.size--;

    return node.value;
  }

  public enqueue(value: T): void {
    const node = { value };
    this.size++;

    if (this.size === 0) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail!.next = node;
      this.tail = node;
    }
  }

  public peek(): T | null {
    return this.size === 0 ? null : this.head!.value;
  }

  public reset(): void {
    this.head = undefined;
    this.tail = undefined;
    this.size = 0;
  }
}

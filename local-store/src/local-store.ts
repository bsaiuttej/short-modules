import { Subject } from "rxjs";

const localStore = new Map<string, LocalStore<any>>();

type StoreValue<T> = {
  key: string;
  value: T;
  pending: boolean;
  updated: number;
  hasError: boolean;
  error?: any;
};

type LocalStoreOptions<T> = {
  storeName: string;
  fn: (value: string) => Promise<T>;
  maxStoreSize?: number;
};

export class LocalStore<T> {
  private readonly store: Map<string, StoreValue<T>> = new Map<string, StoreValue<T>>();
  private readonly create = new Subject<string>();
  private readonly listener: Subject<{
    key: string;
    value: StoreValue<T>;
  }>;
  private currentSize = 0;
  private isCheckingSize = false;

  static get<T>(storeName: string) {
    return localStore.get(storeName) as LocalStore<T>;
  }

  static create<T>(props: LocalStoreOptions<T>) {
    return new LocalStore<T>(props);
  }

  private constructor(private readonly props: LocalStoreOptions<T>) {
    if (!props.maxStoreSize) props.maxStoreSize = 10000;

    this.listener = new Subject();

    localStore.set(this.props.storeName, this);

    this.create.subscribe(async (key) => {
      const existing = this.store.get(key);
      if (existing && existing.pending) return;

      this.store.set(key, {
        key: key,
        value: null,
        pending: true,
        updated: Date.now(),
        hasError: false,
      });
      if (!existing) this.currentSize++;

      console.log(`getting value for ${key} for store ${this.props.storeName}`);

      let response: StoreValue<T>;

      try {
        const value = await this.props.fn(key);
        response = {
          key: key,
          value: value,
          pending: false,
          updated: Date.now(),
          hasError: false,
        };
      } catch (error) {
        response = {
          key: key,
          value: null,
          pending: false,
          updated: Date.now(),
          hasError: true,
          error: error,
        };
      }

      this.store.set(key, response);
      this.listener.next({
        key: key,
        value: response,
      });

      this.checkSize();
    });
  }

  private checkSize() {
    if (this.currentSize < this.props.maxStoreSize) return;
    if (this.isCheckingSize) return;

    this.isCheckingSize = true;

    const toBeRemovedCount = Math.ceil(this.props.maxStoreSize * 0.2);

    const list = Array.from(this.store.values())
      .filter((v) => !v.pending)
      .sort((a, b) => a.updated - b.updated);
    const nonErrors = list.filter((x) => !x.hasError);
    const errors = list.filter((x) => x.hasError);

    if (errors.length > toBeRemovedCount) {
      errors.slice(0, toBeRemovedCount).forEach((x) => this.store.delete(x.key));
      this.currentSize -= toBeRemovedCount;
      return;
    }

    for (let i = 0; i < errors.length; i++) {
      const res = this.store.delete(errors[i].key);
      if (res) this.currentSize--;
    }

    const remaining = toBeRemovedCount - errors.length;
    const removeLength = remaining > nonErrors.length ? nonErrors.length : remaining;

    for (let i = 0; i < removeLength; i++) {
      const res = this.store.delete(list[i].key);
      if (res) this.currentSize--;
    }

    this.isCheckingSize = false;
  }

  async get(key: string) {
    const existing = this.store.get(key);
    if (existing && !existing.pending && !existing.hasError) {
      return existing.value;
    }

    this.create.next(key);
    return new Promise<T>((resolve, reject) => {
      this.listener.subscribe((res) => {
        if (res.key !== key) return;

        if (res.value.hasError) {
          reject(res.value.error);
          return;
        }

        resolve(res.value.value);
      });
    });
  }

  remove(key: string | string[]) {
    if (Array.isArray(key)) {
      for (let i = 0; i < key.length; i++) {
        this.delete(key[i]);
      }
      return;
    }

    this.delete(key);
  }

  private delete(key: string) {
    const res = this.store.delete(key);
    if (res) this.currentSize--;
  }
}

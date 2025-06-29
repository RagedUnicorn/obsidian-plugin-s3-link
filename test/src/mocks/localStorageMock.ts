export const localStorageMock = {
    storage: {} as Record<string, string>,
    setItem(key: string, value: string) {
        this.storage[key] = value;
    },
    getItem(key: string) {
        return this.storage[key] || null;
    },
    removeItem(key: string) {
        delete this.storage[key];
    },
    clear() {
        this.storage = {};
    },
    get length() {
        return Object.keys(this.storage).length;
    },
    key(index: number) {
        const keys = Object.keys(this.storage);
        return keys[index] || null;
    },
};

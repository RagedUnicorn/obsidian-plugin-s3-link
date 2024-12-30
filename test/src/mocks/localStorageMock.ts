export const localStorageMock = {
    storage: {},
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
};

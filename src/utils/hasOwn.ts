export const hasOwn = (o: object, key: PropertyKey): boolean => {
    return {}.hasOwnProperty.call(o, key);
};

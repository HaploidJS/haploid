import { NodeShadowImpl } from './NodeShadowImpl';
import { hasOwn } from '../../utils/hasOwn';
import { mergeByDescriptor } from '../../utils/mergeByDescriptor';

export interface NodeProxyOptions {
    escapeKeys?: PropertyKey[];
}

export abstract class NodeProxy<T extends object> extends NodeShadowImpl<T> {
    readonly #name: string;
    readonly #raw: T;

    readonly #proxyTarget: T;

    readonly #options: NodeProxyOptions;

    // Record keys that deleted.
    readonly #deleteKeyMap: Record<PropertyKey, unknown> = Object.create(null);

    constructor(name: string, raw: T, shadow: Record<PropertyKey, unknown>, options: NodeProxyOptions = {}) {
        super(shadow);

        this.#name = name;
        this.#raw = raw;
        this.#proxyTarget = Object.create(null, {
            constructor: {
                value: Reflect.getPrototypeOf(raw)?.constructor,
                writable: true,
                enumerable: false,
                configurable: true,
            },
        }) as T;

        this.#options = options;

        mergeByDescriptor(this.shadow, this.getBuiltInShadow());
    }

    public get name(): string {
        return this.#name;
    }

    get #escapeKeys(): PropertyKey[] {
        const shadowKeys: PropertyKey[] = Reflect.ownKeys(this.shadow);

        return this.#options.escapeKeys?.filter(key => !shadowKeys.includes(key)) ?? [];
    }

    public get raw(): T {
        return this.#raw;
    }

    protected abstract getBuiltInShadow(): Record<string, unknown>;

    #node: T | null = null;
    public get node(): T {
        if (!this.#node) {
            // Define proxy on a shadow object instead of raw node, because Proxy API has lots of invariants restriction.
            this.#node = new Proxy<T>(this.#proxyTarget, this.getProxyHandler());
        }

        return this.#node;
    }

    protected copyRawPropertySafely(target: T, p: PropertyKey): void {
        const raw = this.raw;
        const debug = this.debug;
        const descriptorInRaw = Reflect.getOwnPropertyDescriptor(raw, p);

        if (descriptorInRaw) {
            // Sync from raw to target in value format
            debug('Sync %s from raw: %o.', String(p), descriptorInRaw);
            if ('value' in descriptorInRaw) {
                Reflect.defineProperty(target, p, descriptorInRaw);
            } else {
                let hasSet = false;
                let val: unknown = undefined;
                Reflect.defineProperty(target, p, {
                    enumerable: descriptorInRaw.enumerable,
                    configurable: descriptorInRaw.configurable,
                    set:
                        'set' in descriptorInRaw
                            ? function (newVal: unknown): void {
                                  val = newVal;
                                  hasSet = true;
                              }
                            : undefined,
                    get:
                        'get' in descriptorInRaw
                            ? function (): unknown {
                                  if (hasSet) return val;
                                  return Reflect.get(raw, p);
                              }
                            : undefined,
                });
            }
        }
    }

    protected prepareProperty(target: T, p: PropertyKey): void {
        const shadow = this.shadow;
        const debug = this.debug;
        const descriptorInShadow = Reflect.getOwnPropertyDescriptor(shadow, p);

        if (hasOwn(target, p)) return;

        if (descriptorInShadow) {
            // Sync from shadow to target
            debug('Sync %s from shadow: %o.', String(p), descriptorInShadow);
            Reflect.defineProperty(target, p, descriptorInShadow);
        } else {
            this.copyRawPropertySafely(target, p);
        }
    }

    #createDefineProperty(): (target: T, p: PropertyKey, attributes: PropertyDescriptor) => boolean {
        const raw = this.raw;
        const getDeleteKeyMap = (): Record<PropertyKey, unknown> => this.#deleteKeyMap;
        const debug = this.debug;
        const prepareProperty = this.prepareProperty.bind(this);
        const copyRawPropertySafely = this.copyRawPropertySafely.bind(this);
        const getEscapeKeys = (): PropertyKey[] => this.#escapeKeys;
        const beforeDefineProperty = (target: T, p: PropertyKey): unknown => this.beforeDefineProperty(target, p);
        const afterDefineProperty = (target: T, p: PropertyKey): unknown => this.afterDefineProperty(target, p);
        // Invariants:
        //
        // The result of [[DefineOwnProperty]] is a Boolean value.
        // A property cannot be added, if the target object is not extensible.
        // A property cannot be non-configurable, unless there exists a corresponding non-configurable own property of the target object.
        // A non-configurable property cannot be non-writable, unless there exists a corresponding non-configurable, non-writable own property of the target object.
        // If a property has a corresponding target object property then applying the Property Descriptor of the property to the target object using [[DefineOwnProperty]] will not throw an exception.

        return function (target: T, p: PropertyKey, attributes: PropertyDescriptor): boolean {
            debug('defineProperty %s with %o.', String(p), attributes);

            // Exception keys through the proxy.
            if (getEscapeKeys().includes(p)) {
                debug('%s is escaped.', String(p));
                copyRawPropertySafely(target, p);
                Reflect.defineProperty(target, p, attributes);
                return Reflect.defineProperty(raw, p, attributes);
            }

            prepareProperty(target, p);

            beforeDefineProperty(target, p);

            const result = Reflect.defineProperty(target, p, attributes);

            afterDefineProperty(target, p);

            if (result) {
                Reflect.deleteProperty(getDeleteKeyMap(), p);
            }

            return result;
        };
    }

    #createDeleteProperty(): (target: T, p: PropertyKey) => boolean {
        const raw = this.raw;
        const getDeleteKeyMap = (): Record<PropertyKey, unknown> => this.#deleteKeyMap;
        const debug = this.debug;
        const prepareProperty = this.prepareProperty.bind(this);
        const copyRawPropertySafely = this.copyRawPropertySafely.bind(this);
        const getEscapeKeys = (): PropertyKey[] => this.#escapeKeys;
        const beforeDeleteProperty = (target: T, p: PropertyKey): unknown => this.beforeDeleteProperty(target, p);
        const afterDeleteProperty = (target: T, p: PropertyKey): unknown => this.afterDeleteProperty(target, p);

        // Invariants:
        //
        // The result of [[Delete]] is a Boolean value.
        // A property cannot be reported as deleted, if it exists as a non-configurable own property of the target object.
        // A property cannot be reported as deleted, if it exists as an own property of the target object and the target object is non-extensible.

        return function (target: T, p: PropertyKey): boolean {
            debug('delete %s.', String(p));
            // Exception keys through the proxy.
            if (getEscapeKeys().includes(p)) {
                debug('%s is escaped.', String(p));
                copyRawPropertySafely(target, p);
                Reflect.deleteProperty(target, p);
                return Reflect.deleteProperty(raw, p);
            }

            prepareProperty(target, p);

            beforeDeleteProperty(target, p);

            const result = Reflect.deleteProperty(target, p);

            afterDeleteProperty(target, p);

            if (result) {
                Reflect.set(getDeleteKeyMap(), p, true);
            }

            return result;
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    #createGet(): (target: T, p: PropertyKey, receiver: any) => any {
        const raw = this.raw;
        const getDeleteKeyMap = (): Record<PropertyKey, unknown> => this.#deleteKeyMap;
        const shadow = this.shadow;
        const debug = this.debug;
        const getEscapeKeys = (): PropertyKey[] => this.#escapeKeys;

        // Invariants:
        //
        // The value reported for a property must be the same as the value of the corresponding target object property if the target object property is a non-writable, non-configurable own data property.
        // The value reported for a property must be undefined if the corresponding target object property is a non-configurable own accessor property that has undefined as its [[Get]] attribute.

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return function (target: T, p: PropertyKey /*, receiver: any */): any {
            debug('get %s.', String(p));

            // Exception keys through the proxy.
            if (getEscapeKeys().includes(p)) {
                return Reflect.get(raw, p);
            }

            if (hasOwn(getDeleteKeyMap(), p)) {
                return undefined;
            }

            if (hasOwn(target, p)) {
                return Reflect.get(target, p);
            }

            if (hasOwn(shadow, p)) {
                return Reflect.get(shadow, p);
            }

            const valueInRaw = Reflect.get(raw, p);

            const specialKeys = 'constructor'.split(',');

            if ('string' === typeof p && /^[A-Z]/.test(p)) {
                debug('treat %s as a constructor, get directly.', p);
                return valueInRaw;
            }

            if ('string' === typeof p && specialKeys.includes(p)) {
                debug('%s is a special key, get directly.', p);
                return valueInRaw;
            }

            if ('function' === typeof valueInRaw) {
                // "valueInRaw" in function may be a function can only run in context of raw, or a constructor.
                // How to tell? There is no absolutely correct solution.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const newValueInTarget = function (this: any, ...args: unknown[]): unknown {
                    if (new.target) {
                        return Reflect.construct(valueInRaw, args);
                    }

                    return Reflect.apply(valueInRaw, raw, args);
                };

                if ('string' === typeof p) {
                    Reflect.defineProperty(newValueInTarget, 'name', {
                        value: p,
                        writable: false,
                        enumerable: true,
                        configurable: true,
                    });
                }

                let descriptorInRaw: PropertyDescriptor | undefined;

                let tar: object | null = raw;
                let count = 0;
                const MAX_RECURSIVE_COUNT = 15;

                // REVIEW is this really necessary?
                // Find descriptor in prototype chain
                for (;;) {
                    descriptorInRaw = Reflect.getOwnPropertyDescriptor(tar, p);
                    if (descriptorInRaw) break;

                    tar = Reflect.getPrototypeOf(tar);
                    if (!tar) break;
                    if (++count === MAX_RECURSIVE_COUNT) break;
                }

                // save to target, in case getting later
                Reflect.defineProperty(target, p, {
                    enumerable: descriptorInRaw?.enumerable ?? true,
                    configurable: descriptorInRaw?.configurable ?? true,
                    value: newValueInTarget,
                    writable: descriptorInRaw ? 'set' in descriptorInRaw || 'value' in descriptorInRaw : true,
                });

                return newValueInTarget;
            }

            return valueInRaw;
        };
    }

    #createGetOwnPropertyDescriptor(): (target: T, p: PropertyKey) => PropertyDescriptor | undefined {
        const raw = this.raw;
        const getDeleteKeyMap = (): Record<PropertyKey, unknown> => this.#deleteKeyMap;
        const shadow = this.shadow;
        const debug = this.debug;
        const copyRawPropertySafely = this.copyRawPropertySafely.bind(this);
        const getEscapeKeys = (): PropertyKey[] => this.#escapeKeys;

        // Invariants:
        //
        // The result of [[GetOwnProperty]] must be either an Object or undefined.
        // A property cannot be reported as non-existent, if it exists as a non-configurable own property of the target object.
        // A property cannot be reported as non-existent, if it exists as an own property of a non-extensible target object.
        // A property cannot be reported as existent, if it does not exist as an own property of the target object and the target object is not extensible.
        // A property cannot be reported as non-configurable, unless it exists as a non-configurable own property of the target object.
        // A property cannot be reported as both non-configurable and non-writable, unless it exists as a non-configurable, non-writable own property of the target object.

        return function (target: T, p: PropertyKey): PropertyDescriptor | undefined {
            debug('getOwnPropertyDescriptor %s.', String(p));
            const descriptorInRaw = Reflect.getOwnPropertyDescriptor(raw, p);

            // Exception keys through the proxy.
            if (getEscapeKeys().includes(p)) {
                debug('%s is escaped.', String(p));
                copyRawPropertySafely(target, p);

                // REVIEW return descriptor in raw or target?
                return descriptorInRaw;
            }

            if (hasOwn(getDeleteKeyMap(), p)) {
                return undefined;
            }

            const descriptorInShadow = Reflect.getOwnPropertyDescriptor(shadow, p);

            // Sync from shadow to target
            if (descriptorInShadow && !hasOwn(target, p)) {
                Reflect.defineProperty(target, p, descriptorInShadow);
            }

            let result;

            if (hasOwn(target, p)) {
                result = Reflect.getOwnPropertyDescriptor(target, p);
            } else {
                result = Reflect.getOwnPropertyDescriptor(raw, p);
                if (result?.configurable === false) {
                    Reflect.defineProperty(target, p, result);
                }
            }

            return result;
        };
    }

    #createHas(): (target: T, p: PropertyKey) => boolean {
        const raw = this.raw;
        const getDeleteKeyMap = (): Record<PropertyKey, unknown> => this.#deleteKeyMap;
        const shadow = this.shadow;
        const debug = this.debug;
        const copyRawPropertySafely = this.copyRawPropertySafely.bind(this);
        const getEscapeKeys = (): PropertyKey[] => this.#escapeKeys;

        // Invariants:
        //
        // The result of [[HasProperty]] is a Boolean value.
        // A property cannot be reported as non-existent, if it exists as a non-configurable own property of the target object.
        // A property cannot be reported as non-existent, if it exists as an own property of the target object and the target object is not extensible.

        return function (target: T, p: PropertyKey): boolean {
            debug('has %s.', String(p));

            // Exception keys through the proxy.
            if (getEscapeKeys().includes(p)) {
                copyRawPropertySafely(target, p);

                return Reflect.has(raw, p);
            }

            if (hasOwn(getDeleteKeyMap(), p)) {
                return false;
            }

            const descriptorInShadow = Reflect.getOwnPropertyDescriptor(shadow, p);

            // Sync from shadow to target
            if (descriptorInShadow && !hasOwn(target, p)) {
                Reflect.defineProperty(target, p, descriptorInShadow);
            }

            return hasOwn(target, p) || Reflect.has(raw, p);
        };
    }

    #createOwnKeys(): (target: T) => ArrayLike<string | symbol> {
        const raw = this.raw;
        const getDeleteKeyMap = (): Record<PropertyKey, unknown> => this.#deleteKeyMap;
        const shadow = this.shadow;
        const getEscapeKeys = (): PropertyKey[] => this.#escapeKeys;

        // Invariants:
        // The result of [[OwnPropertyKeys]] is a List.
        // The returned List contains no duplicate entries.
        // The Type of each result List element is either String or Symbol.
        // The result List must contain the keys of all non-configurable own properties of the target object.
        // If the target object is not extensible, then the result List must contain all the keys of the own properties of the target object and no other values.

        // Quite expensive.
        return function (target: T): ArrayLike<string | symbol> {
            const keyShadow: Record<PropertyKey, 1> = Object.create(null);

            for (const key of Reflect.ownKeys(raw)) {
                keyShadow[key] = 1;
            }
            for (const key of Reflect.ownKeys(shadow)) {
                keyShadow[key] = 1;
            }
            for (const key of Reflect.ownKeys(target)) {
                // target may have some keys that should escape.
                if (getEscapeKeys().includes(key)) continue;
                keyShadow[key] = 1;
            }
            for (const key of Reflect.ownKeys(getDeleteKeyMap())) {
                delete keyShadow[key];
            }

            return Reflect.ownKeys(keyShadow);
        };
    }

    #createSet(): (target: T, p: PropertyKey, value: unknown /*, receiver: unknown */) => boolean {
        const raw = this.raw;
        const getDeleteKeyMap = (): Record<PropertyKey, unknown> => this.#deleteKeyMap;
        const debug = this.debug;
        const prepareProperty = this.prepareProperty.bind(this);
        const copyRawPropertySafely = this.copyRawPropertySafely.bind(this);
        const getEscapeKeys = (): PropertyKey[] => this.#escapeKeys;
        const beforeSet = (target: T, p: PropertyKey, value: unknown): unknown => this.beforeSet(target, p, value);
        const afterSet = (target: T, p: PropertyKey, value: unknown): unknown => this.afterSet(target, p, value);

        // Invariants:
        //
        // The result of [[Set]] is a Boolean value.
        // Cannot change the value of a property to be different from the value of the corresponding target object property if the corresponding target object property is a non-writable, non-configurable own data property.
        // Cannot set the value of a property if the corresponding target object property is a non-configurable own accessor property that has undefined as its [[Set]] attribute.

        return function (target: T, p: PropertyKey, value: unknown /*, receiver: unknown */): boolean {
            debug('set %s=%o.', String(p), value);

            // Exception keys through the proxy.
            if (getEscapeKeys().includes(p)) {
                debug('%s is escaped.', String(p));
                copyRawPropertySafely(target, p);

                Reflect.set(target, p, value);
                return Reflect.set(raw, p, value);
            }

            prepareProperty(target, p);

            beforeSet(target, p, value);

            // It's safe because target has no prototype
            const result = Reflect.set(target, p, value);

            afterSet(target, p, value);

            if (result) {
                Reflect.deleteProperty(getDeleteKeyMap(), p);
            }

            return result;
        };
    }

    protected getProxyHandler(): ProxyHandler<T> {
        const raw = this.raw;
        return {
            defineProperty: this.#createDefineProperty(),
            deleteProperty: this.#createDeleteProperty(),
            get: this.#createGet(),
            getOwnPropertyDescriptor: this.#createGetOwnPropertyDescriptor(),
            getPrototypeOf: function (): object | null {
                // Invariants:
                //
                // The result of [[GetPrototypeOf]] must be either an Object or null.
                // If the target object is not extensible, [[GetPrototypeOf]] applied to the Proxy object must return the same value as [[GetPrototypeOf]] applied to the Proxy object's target object.
                return Reflect.getPrototypeOf(raw);
            },
            has: this.#createHas(),
            // isExtensible?(target: T): boolean;
            ownKeys: this.#createOwnKeys(),
            // preventExtensions?(target: T): boolean;
            set: this.#createSet(),
            // TODO
            // setPrototypeOf?(target: T, v: object | null): boolean;
        };
    }

    // Hooks
    protected abstract beforeDefineProperty(target: T, p: PropertyKey): void;
    protected abstract afterDefineProperty(target: T, p: PropertyKey): void;
    protected abstract beforeDeleteProperty(target: T, p: PropertyKey): void;
    protected abstract afterDeleteProperty(target: T, p: PropertyKey): void;
    protected abstract beforeSet(target: T, p: PropertyKey, value: unknown): void;
    protected abstract afterSet(target: T, p: PropertyKey, value: unknown): void;
}

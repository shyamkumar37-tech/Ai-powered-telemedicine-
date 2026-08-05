/**
 * Generic state container type replacing legacy ReturnType<typeof JSON.parse>.
 */
export type DynamicState<T = any> = T;

/**
 * Generic state object dictionary replacing legacy ReturnType<typeof JSON.parse>.
 */
export type DynamicStateObject<T = Record<string, any>> = T | any;






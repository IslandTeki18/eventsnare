export type Brand<T, B extends string> = T & { readonly __brand: B };

export type ProjectName = Brand<string, 'ProjectName'>;
export type AppName = Brand<string, 'AppName'>;

import type { LocationChange, LocationChangeSignal, RouterIntegration, RouterUtils } from "./types";
export declare function createMemoryHistory(): {
    get: () => string;
    set: ({ value, scroll, replace }: LocationChange) => void;
    back: () => void;
    forward: () => void;
    go: (n: number) => void;
    listen: (listener: (value: string) => void) => () => void;
};
export declare function createIntegration(get: () => string | LocationChange, set: (next: LocationChange) => void, init?: (notify: (value?: string | LocationChange) => void) => () => void, utils?: Partial<RouterUtils>): RouterIntegration;
export declare function normalizeIntegration(integration: RouterIntegration | LocationChangeSignal | undefined): RouterIntegration;
export declare function staticIntegration(obj: LocationChange): RouterIntegration;
export declare function pathIntegration(): RouterIntegration;
export declare function hashIntegration(): RouterIntegration;
export declare function memoryIntegration(): RouterIntegration;

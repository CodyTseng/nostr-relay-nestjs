declare const _default: ({
    readonly rules: Readonly<import("eslint").Linter.RulesRecord>;
} | import("@typescript-eslint/utils/dist/ts-eslint").FlatConfig.Config | {
    files: string[];
    languageOptions: {
        sourceType: string;
        globals?: undefined;
    };
    rules?: undefined;
} | {
    languageOptions: {
        globals: {
            readonly __dirname: false;
            readonly __filename: false;
            readonly AbortController: false;
            readonly AbortSignal: false;
            readonly atob: false;
            readonly Blob: false;
            readonly BroadcastChannel: false;
            readonly btoa: false;
            readonly Buffer: false;
            readonly ByteLengthQueuingStrategy: false;
            readonly clearImmediate: false;
            readonly clearInterval: false;
            readonly clearTimeout: false;
            readonly CompressionStream: false;
            readonly console: false;
            readonly CountQueuingStrategy: false;
            readonly crypto: false;
            readonly Crypto: false;
            readonly CryptoKey: false;
            readonly CustomEvent: false;
            readonly DecompressionStream: false;
            readonly DOMException: false;
            readonly Event: false;
            readonly EventTarget: false;
            readonly exports: true;
            readonly fetch: false;
            readonly File: false;
            readonly FormData: false;
            readonly global: false;
            readonly Headers: false;
            readonly Iterator: false;
            readonly MessageChannel: false;
            readonly MessageEvent: false;
            readonly MessagePort: false;
            readonly module: false;
            readonly navigator: false;
            readonly Navigator: false;
            readonly performance: false;
            readonly Performance: false;
            readonly PerformanceEntry: false;
            readonly PerformanceMark: false;
            readonly PerformanceMeasure: false;
            readonly PerformanceObserver: false;
            readonly PerformanceObserverEntryList: false;
            readonly PerformanceResourceTiming: false;
            readonly process: false;
            readonly queueMicrotask: false;
            readonly ReadableByteStreamController: false;
            readonly ReadableStream: false;
            readonly ReadableStreamBYOBReader: false;
            readonly ReadableStreamBYOBRequest: false;
            readonly ReadableStreamDefaultController: false;
            readonly ReadableStreamDefaultReader: false;
            readonly Request: false;
            readonly require: false;
            readonly Response: false;
            readonly setImmediate: false;
            readonly setInterval: false;
            readonly setTimeout: false;
            readonly structuredClone: false;
            readonly SubtleCrypto: false;
            readonly TextDecoder: false;
            readonly TextDecoderStream: false;
            readonly TextEncoder: false;
            readonly TextEncoderStream: false;
            readonly TransformStream: false;
            readonly TransformStreamDefaultController: false;
            readonly URL: false;
            readonly URLSearchParams: false;
            readonly WebAssembly: false;
            readonly WebSocket: false;
            readonly WritableStream: false;
            readonly WritableStreamDefaultController: false;
            readonly WritableStreamDefaultWriter: false;
        };
        sourceType?: undefined;
    };
    files?: undefined;
    rules?: undefined;
} | {
    files: string[];
    rules: {
        '@typescript-eslint/no-explicit-any': string;
        '@typescript-eslint/no-unsafe-function-type'?: undefined;
    };
    languageOptions?: undefined;
} | {
    files: string[];
    rules: {
        '@typescript-eslint/no-unsafe-function-type': string;
        '@typescript-eslint/no-explicit-any'?: undefined;
    };
    languageOptions?: undefined;
})[];
export default _default;

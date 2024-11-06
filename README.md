# Browser std.
My browser standard library.

## Why?
Because native browser API is badly designed. Often to make one logically change we must calls multiple API methods. 

## About Exceptions / Errors
Library doesn't use `exceptions` and `try{ ... } catch{ ... }` syntax. All code which can throw are wrapped.

## Native browser API to `brwoser.std` mapping.
| Native API | browser.std |
|-|-|
|browser.runtime|[api/backend/AddonLifecycle](src/api/backend/AddonLifecycle.ts) <br> [api/backend/BackendComm](src/api/backend/BackendComm.ts) <br> [api/frontend/FrontendComm](src/api/frontend/FrontendComm.ts)|
|browser.declarativeNetRequest|[api/backend/NetRequestBlock](src/api/backend/NetRequestBlock.ts)|
|browser.storage.local|[api/backend/LocalStorage](src/api/backend/LocalStorage.ts)|
|browser.tabs|[api/backend/BackendComm](src/api/backend/BackendComm.ts)|




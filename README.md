# Browser std.
My browser standard library.

# Why?
Because native browser API is badly designed. Often to make one logically change we must calls multiple API methods. 

# About Exceptions / Errors
Library doesn't use exceptions and `try{ ... } catch{ ... }` syntax. All code which can throw are wrapped.

# Native browser API to `brwoser.std` mapping.
| Native API | browser.std |
|-|-|
|browser.runtime|api/backend/AddonLifecycle <br> api/backend/BackendComm|
|browser.declarativeNetRequest|api/backend/NetRequestBlock|
|browser.storage.local|api/backend/LocalStorage|


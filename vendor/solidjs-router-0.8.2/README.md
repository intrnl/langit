A modified, vendored copy of @solidjs/router@0.8.2

Bun doesn't support patched dependencies at the moment, so the best way to do this for the time being would to be to just vendor them in for now.

---

Adds proper location keys to uniquely identify history entries.

```patch
diff --git a/dist/routing.js b/dist/routing.js
index 0a33e859ba30d467e5fc098f562c7119513dfb43..3913c1b69c5ee75ebe78eda0f9a9e4539954c5f5 100644
--- a/dist/routing.js
+++ b/dist/routing.js
@@ -162,7 +162,6 @@ export function createLocation(path, state) {
     const pathname = createMemo(() => url().pathname);
     const search = createMemo(() => url().search, true);
     const hash = createMemo(() => url().hash);
-    const key = createMemo(() => "");
     return {
         get pathname() {
             return pathname();
@@ -174,14 +173,15 @@ export function createLocation(path, state) {
             return hash();
         },
         get state() {
-            return state();
+            return state().val;
         },
         get key() {
-            return key();
+            return state().key;
         },
         query: createMemoObject(on(search, () => extractSearchParams(url())))
     };
 }
+const ROOT_STATE = { key: ':root', val: null };
 export function createRouterContext(integration, base = "", data, out) {
     const { signal: [source, setSource], utils = {} } = normalizeIntegration(integration);
     const parsePath = utils.parsePath || (p => p);
@@ -211,7 +211,7 @@ export function createRouterContext(integration, base = "", data, out) {
         }
     };
     const [reference, setReference] = createSignal(source().value);
-    const [state, setState] = createSignal(source().state);
+    const [state, setState] = createSignal(source().state || ROOT_STATE);
     const location = createLocation(reference, state);
     const referrers = [];
     const baseRoute = {
@@ -258,6 +258,7 @@ export function createRouterContext(integration, base = "", data, out) {
                 scroll: true,
                 ...options
             };
+            const actualNextState = { key: createKey(), val: nextState };
             const resolvedTo = resolve ? route.resolvePath(to) : resolvePath("", to);
             if (resolvedTo === undefined) {
                 throw new Error(`Path '${to}' is not a routable path`);
@@ -266,24 +267,24 @@ export function createRouterContext(integration, base = "", data, out) {
                 throw new Error("Too many redirects");
             }
             const current = reference();
-            if (resolvedTo !== current || nextState !== state()) {
+            if (resolvedTo !== current || nextState !== state().val) {
                 if (isServer) {
                     if (output) {
                         output.url = resolvedTo;
                     }
-                    setSource({ value: resolvedTo, replace, scroll, state: nextState });
+                    setSource({ value: resolvedTo, replace, scroll, state: actualNextState });
                 }
                 else if (beforeLeave.confirm(resolvedTo, options)) {
                     const len = referrers.push({ value: current, replace, scroll, state: state() });
                     start(() => {
                         setReference(resolvedTo);
-                        setState(nextState);
+                        setState(actualNextState);
                         resetErrorBoundaries();
                     }).then(() => {
                         if (referrers.length === len) {
                             navigateEnd({
                                 value: resolvedTo,
-                                state: nextState
+                                state: actualNextState
                             });
                         }
                     });
@@ -316,7 +317,7 @@ export function createRouterContext(integration, base = "", data, out) {
             if (value !== reference()) {
                 start(() => {
                     setReference(value);
-                    setState(state);
+                    setState(state || ROOT_STATE);
                 });
             }
         });
@@ -371,6 +372,9 @@ export function createRouterContext(integration, base = "", data, out) {
         beforeLeave
     };
 }
+function createKey () {
+    return Date.now().toString(36);
+}
 export function createRouteContext(router, parent, child, match, params) {
     const { base, location, navigatorFactory } = router;
     const { pattern, element: outlet, preload, data } = match().route;
```

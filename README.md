# React Native Honeycomb Sample App

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app) demonstrating how to integrate Honeycomb into a React Native app using OpenTelemetry SDKs.

## Setup and Run This App

To use this app:

1. Run `npm ci` to install dependencies.
2. Update the `serviceName` and `honeycombKey` in [app/honeycomb.tsx](app/honeycomb.tsx).
3. Run `npm run ios`

To add Honeycomb to an existing React Native app, follow these steps:

1. Add [metro.config.js](metro.config.js) to the root of your repo and enable `config.resolver.unstable_enablePackageExports`. This is required for OpenTelemetry to be able to properly import its dependencies.

2. Install OpenTelemetry dependencies to your app.
```bash
npm install --save \
    @opentelemetry/api \
    @opentelemetry/api-logs@0.55.0 \
    @opentelemetry/sdk-logs@0.55.0 \
    @opentelemetry/sdk-metrics \
    @opentelemetry/sdk-trace-web \
    @opentelemetry/exporter-logs-otlp-http@0.55.0 \
    @opentelemetry/exporter-metrics-otlp-http@0.55.0 \
    @opentelemetry/exporter-trace-otlp-http@0.55.0
```

3. Add OpenTelemetry configuration code as found in [app/honeycomb.tsx](app/honeycomb.tsx). This code can be customized as desired.

4. Update the `serviceName` and `honeycombKey` in `honeycomb.tsx` for your particular project.

5. Call `configureHoneycomb();` from the top level of your app, such as in the `RootLayout` function.

6. See examples in [app/(tabs)/demo.tsx](app/(tabs)/demo.tsx) for how to create manual telemetry.

For more information, including how to configure auto-instrumentation for `fetch` and other libraries, see the [OpenTelemetry Demo documentation for React Native](https://opentelemetry.io/docs/demo/services/react-native-app/).

## Installing a native SDK

To get Core Mobile Vitals and other auto-instrumentation, or to instrument native code, you can
install a native Honeycomb SDK alongside the React Native SDK.

Note: It is recommended to use different `service.name`s for iOS, Android, and React Native, e.g. `“my-app-ios”`, `“my-app-android”`, and `“my-app-react-native”`, so that each app will appear as a separate dataset.

## Installing the Swift SDK

To get started, install the
[Honeycomb Swift SDK](https://github.com/honeycombio/honeycomb-opentelemetry-swift) following
the instructions in its README.

React Native native modules are usually written in Objective C, while the Honeycomb SDK is written
in Swift, so you will want to make an `@objc` wrapper for Honeycomb and use it to call through to
Swift methods.

```swift
@objc public class HoneycombWrapper : NSObject {
    @objc public func configure() {
        do {
            let options = try HoneycombOptions.Builder()
                .setAPIKey("YOUR-API-KEY-HERE")
                .setServiceName("YOUR-SERVICE-NAME-HERE")
                .build()
            try Honeycomb.configure(options: options)
        } catch {
            NSException(name: NSExceptionName("HoneycombOptionsError"), reason: "\(error)").raise()
        }
    }
}
```

You can initialize the wrapper from your module's `init` method.

```objectivec
- (instancetype)init {
    self = [super init];
    if (self) {
        _honeycomb = [[HoneycombWrapper alloc] init];
        [_honeycomb configure];
    }
    return self;
}
```

## Installing the native Android SDK

To get started, install the
[Honeycomb Android SDK](https://github.com/honeycombio/honeycomb-opentelemetry-android) following
the instructions in its README.

Add an `OpenTelemetryRum` member to your `Application` subclass, and initialize it in `onCreate`.

```kotlin
class MainApplication : Application(), ReactApplication {
    var otelRum: OpenTelemetryRum? = null

    // ...

    override fun onCreate() {
        super.onCreate()

        val options = HoneycombOptions.builder(this)
            .setApiKey("YOUR-API-KEY-HERE")
            .setServiceName("YOUR-SERVICE-NAME-HERE")
            .build()

        otelRum = Honeycomb.configure(this, options)
    }
}
```

Add a `val otel: () -> OpenTelemetryRum?` member to your native module, and pass in
`{ otelRum }` when constructing it.

## Trace Propagation

When calling into native code from JavaScript, you can manually pass through a parent ID and trace
ID, to have the telemetry show up as a single trace in Honeycomb.

In Android:

```kotlin
@ReactMethod
fun sendNativeSpanWithParent(parentId: String?, traceId: String?) {
    otel()?.let { otel ->
        var spanBuilder = otel
            .openTelemetry
            .getTracer("android sdk")
            .spanBuilder("child span")

        if (parentId != null && traceId != null) {
            val remoteContext = SpanContext.createFromRemoteParent(
                traceId,
                parentId,
                TraceFlags.getDefault(),
                TraceState.getDefault(),
            )

            val context = Context.current().with(Span.wrap(remoteContext))

            spanBuilder = spanBuilder.setParent(context)
        }

        val span = spanBuilder.startSpan()
        span.end()
    }
}
```

Or iOS:

```swift
@objc public func sendSpan(parentId: String?, traceId: String?) {
    let tracerProvider = OpenTelemetry.instance.tracerProvider.get(
        instrumentationName: "swift sdk",
        instrumentationVersion: nil
    )

    var spanBuilder = tracerProvider
        .spanBuilder(spanName: "child span")

    if let traceId = traceId, let parentId = parentId {
        spanBuilder = spanBuilder.setParent(SpanContext.createFromRemoteParent(
        traceId: TraceId(fromHexString: traceId),
        spanId: SpanId(fromHexString: parentId),
        traceFlags: TraceFlags(),
        traceState: TraceState()))
    }

    let span = spanBuilder.startSpan()
    span.end()
}
```

```objectivec
RCT_EXPORT_METHOD(sendNativeSpanWithParent:(NSString *)parentID trace:(NSString *)traceID) {
    [_honeycomb sendSpanWithParentId:parentID traceId:traceID];
}
```

To obtain the IDs from JavaScript:

```typescript
function sendNativeSpan(parentId: string, traceId: string) {
  const {YourModule} = NativeModules;
  YourModule.sendNativeSpanWithParent(parentId, traceId);
}

trace
    .getTracer("javascript sdk")
    .startActiveSpan("parent span", span => {
        let parentId = span.spanContext().spanId;
        let traceId = span.spanContext().traceId;
        sendNativeSpan(parentId, traceId);
        span.end();
    });
```

## Session Syncing

Sometimes, it's not possible or desirable to manually pass through trace IDs.
But it's still useful to be able to have a consistent `session.id` to identify
all the traces within a single session, regardless of whether the telemetry was
sent from JavaScript, Swift, or Kotlin. To do that, you can add a `SpanProcessor`
to the JavaScript layer to let it use the `session.id` generated by the native
SDK.

In Android, it's easy to add a function to your native module to get the session ID.
```kotlin
@ReactMethod(isBlockingSynchronousMethod = true)
fun getSessionId(): String? = otel()?.rumSessionId
```

And in iOS, it's almost as easy. Add a method to your Swift wrapper.
```swift
@objc public var sessionId: String? {
    get {
        return Honeycomb.currentSession()?.id
    }
}
```

Then add a method to the Objective C native module code to call the wrapper.

```objectivec
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getSessionId) {
    return [_honeycomb sessionId];
}
```

In your JavaScript layer, create a `SessionProvider`:

```typescript
class SessionIdProvider implements SessionProvider {
    getSessionId(): string | null {
        const {HoneycombModule} = NativeModules;
        return HoneycombModule.getSessionId();
    }
}
```

Finally, update the configuration code to pass in the new processor:

```typescript
    const traceProvider = new WebTracerProvider({
        resource,
        spanProcessors: [
            createSessionSpanProcessor(new SessionIdProvider()),
            new SimpleSpanProcessor(
                new OTLPTraceExporter({ headers, url: `${honeycombURL}/v1/traces` })
            ),
            new SimpleSpanProcessor(new ConsoleSpanExporter()),
        ],
    });
```

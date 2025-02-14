# React Native Honeycomb Sample App

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app) demonstrating how to integrate Honeycomb into a React Native app using OpenTelemetry SDKs.

To add Honeycomb to an existing React Native app, follow these steps:

1. Add [metro.config.js](metro.config.js) to the root of your repo. This is required for OpenTelemetry to be able to properly import its dependencies.

2. Install OpenTelemetry dependencies to your app.
```bash
npm install --save \
    @opentelemetry/api \
    @opentelemetry/api-logs \
    @opentelemetry/sdk-logs \
    @opentelemetry/sdk-metrics \
    @opentelemetry/sdk-trace-web \
    @opentelemetry/exporter-logs-otlp-http \
    @opentelemetry/exporter-metrics-otlp-http \
    @opentelemetry/exporter-trace-otlp-http
```

3. Add OpenTelemetry configuration code as found in [app/honeycomb.tsx](app/honeycomb.tsx). This code can be customized as desired.

4. Update the `serviceName` and `honeycombKey` in `honeycomb.tsx` for your particular project.

5. Call `configureHoneycomb();` from the top level of your app, such as in the `RootLayout` function.

6. See examples in [app/(tabs)/demo.tsx](app/(tabs)/demo.tsx) for how to create manual telemetry.

For more information, including how to configure auto-instrumentation for `fetch` and other libraries, see the [OpenTelemetry React Native documentation](https://opentelemetry.io/docs/demo/services/react-native-app/).
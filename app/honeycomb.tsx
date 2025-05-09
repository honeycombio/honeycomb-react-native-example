
import { NativeModules } from 'react-native';
import { Context, metrics } from '@opentelemetry/api';
import { logs } from '@opentelemetry/api-logs';

import {
    ConsoleSpanExporter,
    SimpleSpanProcessor,
    WebTracerProvider,
} from "@opentelemetry/sdk-trace-web";

import {
    ConsoleMetricExporter,
    MeterProvider,
    PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";

import {
    ConsoleLogRecordExporter,
    LoggerProvider,
    SimpleLogRecordProcessor,
} from "@opentelemetry/sdk-logs";

import { Resource } from "@opentelemetry/resources";

import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";

import {
    createSessionSpanProcessor,
    SessionProvider
} from '@opentelemetry/web-common';

class SessionIdProvider implements SessionProvider {
    getSessionId(): string | null {
        const {HoneycombModule} = NativeModules;
        return HoneycombModule.getSessionId();
    }
}

export default function configureHoneycomb() {
    console.log("OpenTelemetry is initializing...");

    const serviceName = "reactnative-demo";
    const honeycombKey = "YOUR-API-KEY-HERE";
    const honeycombURL = "https://api.honeycomb.io";

    const resource = new Resource({
        "service.name": serviceName,
    });
    const headers = {
        "x-honeycomb-team": honeycombKey,
        "x-honeycomb-dataset": serviceName,
    };

    // Traces

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
    traceProvider.register();

    // Metrics

    const metricsHeaders = {
        "x-honeycomb-team": honeycombKey,
        "x-honeycomb-dataset": `${serviceName}-metrics`,
    };
    const metricExporter = new OTLPMetricExporter({
        headers: metricsHeaders,
        url: `${honeycombURL}/v1/metrics`,
    });
    const meterProvider = new MeterProvider({
        resource,
        readers: [
            new PeriodicExportingMetricReader({
                exporter: metricExporter,
            }),
            new PeriodicExportingMetricReader({
              exporter: new ConsoleMetricExporter(),
            }),
        ],
    });
    metrics.setGlobalMeterProvider(meterProvider);

    // Logging

    const logExporter = new OTLPLogExporter({
        headers,
        url: `${honeycombURL}/v1/logs`,
    });
    const loggerProvider = new LoggerProvider({ resource });
    loggerProvider.addLogRecordProcessor(new SimpleLogRecordProcessor(logExporter));
    loggerProvider.addLogRecordProcessor(new SimpleLogRecordProcessor(new ConsoleLogRecordExporter()));
    logs.setGlobalLoggerProvider(loggerProvider);

    // Example telemetry code.

    console.log("OpenTelemetry is initialized.");
}
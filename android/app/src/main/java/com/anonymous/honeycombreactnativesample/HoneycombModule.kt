package com.anonymous.honeycombreactnativesample

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import io.opentelemetry.android.OpenTelemetryRum
import io.opentelemetry.api.trace.Span
import io.opentelemetry.api.trace.SpanContext
import io.opentelemetry.api.trace.TraceFlags
import io.opentelemetry.api.trace.TraceState
import io.opentelemetry.context.Context

class HoneycombModule(
    context: ReactApplicationContext,
    val otel: () -> OpenTelemetryRum?,
): ReactContextBaseJavaModule(context) {
    override fun getName() = "HoneycombModule"

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getSessionId(): String? = otel()?.rumSessionId

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
}



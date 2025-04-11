
import Foundation
import Honeycomb
import OpenTelemetryApi

@objc public class HoneycombWrapper : NSObject {
  private let sessionLock = NSLock()

  private var _sessionId: String? = nil
  
  @objc public var sessionId: String? {
    get {
      return sessionLock.withLock {
        _sessionId
      }
    }
    set(value) {
      sessionLock.withLock {
        _sessionId = value
      }
    }
  }
  

  @objc public func configure() {
    NotificationCenter.default.addObserver(
        forName: .sessionStarted,
        object: nil,
        queue: .main
    ) { notification in
        guard let session = notification.userInfo?["session"] as? HoneycombSession else {
          self.sessionId = nil
          return
        }
        self.sessionId = session.id
    }

    do {
        let options = try HoneycombOptions.Builder()
            .setAPIKey("YOUR-API-KEY-HERE")
            .setServiceName("reactnative-demo-ios")
            .build()
        try Honeycomb.configure(options: options)
    } catch {
        NSException(name: NSExceptionName("HoneycombOptionsError"), reason: "\(error)").raise()
    }
    
    // HACK: Send a span just to initialize the session ID.
    let tracerProvider = OpenTelemetry.instance.tracerProvider.get(
        instrumentationName: "swift sdk",
        instrumentationVersion: nil
    )
    let span = tracerProvider
      .spanBuilder(spanName: "init")
      .startSpan()
    span.end()
  }

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
}

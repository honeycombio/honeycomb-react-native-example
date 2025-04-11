
#import "HNYModule.h"
#import "honeycombreactnativesample-Swift.h"

@implementation HNYModule

- (instancetype)init {
  self = [super init];
  if (self) {
    _honeycomb = [[HoneycombWrapper alloc] init];
    [_honeycomb configure];
  }
  return self;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getSessionId) {
  return [_honeycomb sessionId];
}

RCT_EXPORT_METHOD(sendNativeSpanWithParent:(NSString *)parentID trace:(NSString *)traceID) {
  [_honeycomb sendSpanWithParentId:parentID traceId:traceID];
}

RCT_EXPORT_MODULE(HoneycombModule);

@end

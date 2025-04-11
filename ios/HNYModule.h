
#import <React/RCTBridgeModule.h>

@class HoneycombWrapper;

@interface HNYModule : NSObject <RCTBridgeModule> {
  HoneycombWrapper *_honeycomb;
}

@end

import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import { trace, metrics } from '@opentelemetry/api';
import {logs} from '@opentelemetry/api-logs'

function onTraceClick() {
  let span = trace.getTracer("react-native-demo").startSpan("button-click");
  console.log("the trace button was clicked!");
  span.end();
}

function onMetricClick() {
  console.log("the metric button was clicked!");
  const meter = metrics.getMeter("react-meter");
  const counter = meter.createCounter("react-counter");
  counter.add(42, {
      name: "react-metric",
      meterattr: "this is a metric"
  });
}

function onLogClick() {
  console.log("the log button was clicked!");
  logs.getLogger("react-logger").emit({
    body: "This is a react log.",
    attributes: {
        name: "react-log",
    },
});
}

export default function DemoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={<Ionicons size={310} name="code-slash" style={styles.headerImage} />}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Demo</ThemedText>
      </ThemedView>

      <Button
        onPress={onTraceClick}
        title="Send a trace."
        color="#841584"
        accessibilityLabel="trace_demo_button"
      />

      <Button
        onPress={onMetricClick}
        title="Send a metric."
        color="#841584"
        accessibilityLabel="metric_demo_button"
      />

      <Button
        onPress={onLogClick}
        title="Send a log."
        color="#841584"
        accessibilityLabel="log_demo_button"
      />

      <ThemedText>These elements are instrumented with Honeycomb.</ThemedText>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});

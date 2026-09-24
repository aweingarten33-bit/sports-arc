import React from 'react';
import {WebView, type WebViewNavigation, type WebViewProps} from 'react-native-webview';

export type WebViewInstance = InstanceType<typeof WebView>;

// The published react-native-webview types declare `class WebView<P = undefined>`,
// which collapses the prop type to `never` under TypeScript strict mode.
// This alias recovers the intended props (plus a ref) without patching the lib.
export const TypedWebView = WebView as unknown as new (
  props: WebViewProps & {ref?: React.Ref<WebViewInstance>},
) => WebViewInstance;

export type {WebViewNavigation, WebViewProps};

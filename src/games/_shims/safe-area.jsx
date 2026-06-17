// Web shim for react-native-safe-area-context. No notches to dodge on a framed
// web canvas, so insets are zero and the provider is a pass-through.
import React from 'react'

export function SafeAreaProvider({ children }) {
  return <>{children}</>
}
export function useSafeAreaInsets() {
  return { top: 0, bottom: 0, left: 0, right: 0 }
}
export const SafeAreaView = ({ children, ...rest }) => <div {...rest}>{children}</div>

export default { SafeAreaProvider, useSafeAreaInsets, SafeAreaView }

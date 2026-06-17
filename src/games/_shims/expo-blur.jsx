// Web shim for `expo-blur`'s <BlurView> → a View with a CSS backdrop blur.
import React from 'react'
import { View } from 'react-native'

export function BlurView({ intensity = 45, tint = 'light', style, children, ...rest }) {
  const radius = Math.max(2, Math.min(40, (intensity / 100) * 40))
  const bg =
    tint === 'dark' ? 'rgba(20,20,20,0.30)' : 'rgba(255,255,255,0.28)'
  const blur = {
    backgroundColor: bg,
    backdropFilter: `blur(${radius}px)`,
    WebkitBackdropFilter: `blur(${radius}px)`,
  }
  return (
    <View style={[style, blur]} {...rest}>
      {children}
    </View>
  )
}

export default { BlurView }

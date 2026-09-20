// 通用按钮 —— 三种语气，尺寸统一，避免各页面各写一套 Pressable 样式

import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native'
import { colors, fontSize, radius, spacing } from './theme'

export type ButtonTone = 'primary' | 'secondary' | 'danger'

export interface ButtonProps {
  label: string
  onPress: () => void
  tone?: ButtonTone
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

export function Button({ label, onPress, tone = 'primary', disabled = false, style }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        tone === 'primary' ? styles.primary : null,
        tone === 'secondary' ? styles.secondary : null,
        tone === 'danger' ? styles.danger : null,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text style={[styles.label, tone === 'primary' ? styles.labelOnAccent : styles.labelPlain]}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  secondary: { backgroundColor: colors.surface, borderColor: colors.accentLight },
  danger: { backgroundColor: colors.surface, borderColor: colors.accent },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.45 },
  label: { fontSize: fontSize.body, fontWeight: '600' },
  labelOnAccent: { color: colors.bg },
  labelPlain: { color: colors.text },
})

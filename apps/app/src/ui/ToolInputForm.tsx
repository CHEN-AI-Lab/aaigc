// ─────────────────────────────────────────────────────────────────────────────
// 声明式表单 —— 由 ToolDefinition.inputs 驱动，38 个工具共用一套渲染
//
// 表单**不校验**业务规则：所有校验都在 shared 的 tool.parse() 里（唯一真源），
// 这里只负责"把用户输入变成 Record<string, unknown>"并交给 runToolById。
// 因此 App 与 Web / CLI / 小程序的非法输入行为天然一致。
//
// 表单值统一用字符串保存：shared 的 readInt / readBool / readEnum 都接受字符串
// （见 shared/tools/common.ts），不需要在这里做类型转换。
// ─────────────────────────────────────────────────────────────────────────────

import { StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import type { ToolInputField } from 'shared/types/tool'
import { colors, fontSize, radius, spacing } from './theme'

export type ToolFormValues = Record<string, string>

/** 按字段声明初始化表单值（default 优先，boolean 缺省 false，其余空串） */
export function initialFormValues(fields: readonly ToolInputField[]): ToolFormValues {
  const values: ToolFormValues = {}
  for (const field of fields) {
    if (field.default !== undefined) {
      values[field.name] = String(field.default)
    } else if (field.kind === 'boolean') {
      values[field.name] = 'false'
    } else {
      values[field.name] = ''
    }
  }
  return values
}

/** 表单值 → 工具入参（空串保留，由 parse() 判定 emptyInput；不要在这里"帮"它过滤） */
export function formValuesToInput(values: ToolFormValues): Record<string, unknown> {
  const raw: Record<string, unknown> = {}
  for (const [name, value] of Object.entries(values)) raw[name] = value
  return raw
}

export interface ToolInputFormProps {
  fields: readonly ToolInputField[]
  values: ToolFormValues
  onChange: (name: string, value: string) => void
  /** 文案查找（labelKey / placeholderKey / option.labelKey 都走 shared/messages） */
  t: (key: string) => string
}

export function ToolInputForm({ fields, values, onChange, t }: ToolInputFormProps) {
  return (
    <View style={styles.form}>
      {fields.map((field) => (
        <View key={field.name} style={styles.field}>
          <Text style={styles.label}>
            {t(field.labelKey)}
            {field.required ? <Text style={styles.required}> *</Text> : null}
          </Text>
          <FieldControl field={field} value={values[field.name] ?? ''} onChange={onChange} t={t} />
        </View>
      ))}
    </View>
  )
}

function FieldControl({
  field,
  value,
  onChange,
  t,
}: {
  field: ToolInputField
  value: string
  onChange: (name: string, value: string) => void
  t: (key: string) => string
}) {
  const placeholder = field.placeholderKey !== undefined ? t(field.placeholderKey) : undefined

  switch (field.kind) {
    case 'textarea':
      return (
        <TextInput
          style={[styles.input, styles.textarea]}
          value={value}
          onChangeText={(next) => onChange(field.name, next)}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          multiline
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
        />
      )

    case 'number':
      return (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(next) => onChange(field.name, next)}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType="numbers-and-punctuation"
        />
      )

    case 'boolean':
      return (
        <Switch
          value={value === 'true'}
          onValueChange={(next) => onChange(field.name, next ? 'true' : 'false')}
          trackColor={{ false: colors.surface, true: colors.accentLight }}
          thumbColor={colors.accent}
        />
      )

    case 'color':
      // 不引入取色器依赖：直接输入 #RRGGBB，校验交给 shared 的 invalidHex
      return (
        <View style={styles.colorRow}>
          <View style={[styles.colorSwatch, { backgroundColor: value.length > 0 ? value : colors.surface }]} />
          <TextInput
            style={[styles.input, styles.colorInput]}
            value={value}
            onChangeText={(next) => onChange(field.name, next)}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      )

    case 'select':
      return (
        <View style={styles.options}>
          {(field.options ?? []).map((option) => {
            const selected = value === option.value
            return (
              <Text
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onChange(field.name, option.value)}
                style={[styles.option, selected ? styles.optionSelected : null]}
              >
                {t(option.labelKey)}
              </Text>
            )
          })}
        </View>
      )

    case 'file':
      // 文件类输入需要 expo-document-picker，本趟未接入 —— 明确说明，不静默留空
      return <Text style={styles.unsupported}>{t('tools.unsupportedPlatform')}</Text>

    case 'text':
    default:
      return (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(next) => onChange(field.name, next)}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
        />
      )
  }
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  field: { gap: spacing.sm },
  label: { fontSize: fontSize.body, fontWeight: '600', color: colors.text },
  required: { color: colors.accent },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accentLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.body,
    color: colors.text,
  },
  textarea: { minHeight: 120 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.accentLight,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: fontSize.body,
    overflow: 'hidden',
  },
  optionSelected: { backgroundColor: colors.accentLight, fontWeight: '700' },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  colorSwatch: { width: 36, height: 36, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.accentLight },
  colorInput: { flex: 1 },
  unsupported: { color: colors.textSecondary, fontSize: fontSize.body },
})

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

type Role = 'assistant' | 'developer' | 'user'
type Task = 'write' | 'code' | 'analyze' | 'translate' | 'summarize' | 'creative'

const ROLE_KEYS: Record<Role, string> = { assistant: 'roleAssistant', developer: 'roleDeveloper', user: 'roleUser' }
const TASK_KEYS: Record<Task, string> = {
  write: 'taskWrite', code: 'taskCode', analyze: 'taskAnalyze',
  translate: 'taskTranslate', summarize: 'taskSummarize', creative: 'taskCreative',
}

const TASK_TEMPLATES: Record<Task, { tone: string; context: string; instruction: string }> = {
  write: { tone: 'professional', context: 'Topic/subject matter', instruction: 'Write a clear, well-structured piece on the topic' },
  code: { tone: 'technical', context: 'Programming language, framework', instruction: 'Write clean, well-commented code that solves the problem' },
  analyze: { tone: 'analytical', context: 'Data, document, or text to analyze', instruction: 'Analyze the provided content and extract key insights' },
  translate: { tone: 'natural', context: 'Source text to translate', instruction: 'Translate the text naturally while preserving meaning and tone' },
  summarize: { tone: 'concise', context: 'Long text to summarize', instruction: 'Summarize the key points in a clear, structured format' },
  creative: { tone: 'imaginative', context: 'Theme, style, or concept', instruction: 'Create an original piece based on the given theme' },
}

export default function PromptGenerator() {
  const t = useTranslations('tools.prompt-generator')
  const [role, setRole] = useState<Role>('assistant')
  const [task, setTask] = useState<Task>('write')
  const [tone, setTone] = useState('professional')
  const [context, setContext] = useState('')
  const [instruction, setInstruction] = useState('')
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)

  const generate = () => {
    const template = TASK_TEMPLATES[task]
    const parts: string[] = []

    if (role === 'developer') {
      parts.push(`<System>You are a helpful ${tone} assistant. ${template.instruction}.</System>`)
    }

    const ctx = context.trim() || template.context
    if (role === 'developer') {
      parts.push(`\n<Context>${ctx}</Context>`)
    } else {
      parts.push(`\nContext: ${ctx}`)
    }

    const instr = instruction.trim() || template.instruction
    if (role === 'developer') {
      parts.push(`\n<Instruction>${instr}</Instruction>`)
    } else {
      parts.push(`\n${instr}`)
    }

    setOutput(parts.join(''))
    setCopied(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    setRole('assistant')
    setTask('write')
    setTone('professional')
    setContext('')
    setInstruction('')
    setOutput('')
    setCopied(false)
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Role selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-text-secondary w-20 shrink-0">{t('role')}</label>
        <div className="flex gap-1">
          {(Object.entries(ROLE_KEYS) as [Role, string][]).map(([key, labelKey]) => (
            <button key={key} onClick={() => setRole(key)}
              className={`px-3 py-1.5 text-xs rounded-sm transition-colors ${role === key ? 'bg-accent text-white' : 'bg-surface text-text-secondary hover:text-text-primary'}`}>
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Task selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-text-secondary w-20 shrink-0">{t('task')}</label>
        <div className="flex gap-1 flex-wrap">
          {(Object.entries(TASK_KEYS) as [Task, string][]).map(([key, labelKey]) => (
            <button key={key} onClick={() => {
              setTask(key)
              const tpl = TASK_TEMPLATES[key]
              setTone(tpl.tone)
            }}
              className={`px-3 py-1.5 text-xs rounded-sm transition-colors ${task === key ? 'bg-accent text-white' : 'bg-surface text-text-secondary hover:text-text-primary'}`}>
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Tone */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-text-secondary w-20 shrink-0">{t('tone')}</label>
        <input type="text" value={tone} onChange={e => setTone(e.target.value)}
          className="flex-1 p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30" />
      </div>

      {/* Context */}
      <div>
        <label className="block text-sm text-text-secondary mb-1">{t('context')}</label>
        <textarea value={context} onChange={e => setContext(e.target.value)} rows={3}
          placeholder={t('contextPlaceholder')}
          className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30 resize-y" />
      </div>

      {/* Instruction */}
      <div>
        <label className="block text-sm text-text-secondary mb-1">{t('instruction')}</label>
        <textarea value={instruction} onChange={e => setInstruction(e.target.value)} rows={3}
          placeholder={t('instructionPlaceholder')}
          className="w-full p-2 bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary focus:outline-none focus:border-accent/30 resize-y" />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={generate}
          className="px-6 py-2 bg-accent text-white text-sm font-medium rounded-sm hover:opacity-90 transition-opacity">
          {t('generate')}
        </button>
        <button onClick={handleReset}
          className="px-4 py-2 bg-surface text-text-secondary text-sm rounded-sm border border-[rgba(127,99,21,0.15)] hover:text-text-primary transition-colors">
          {t('reset')}
        </button>
      </div>

      {/* Output */}
      {output && (
        <div className="relative">
          <textarea readOnly value={output} rows={6}
            className="w-full p-3 bg-card border border-[rgba(127,99,21,0.15)] rounded-sm text-sm text-text-primary font-mono focus:outline-none resize-y" />
          <button onClick={handleCopy}
            className="absolute top-2 right-2 px-2 py-1 text-xs bg-surface border border-[rgba(127,99,21,0.15)] rounded-sm text-text-secondary hover:text-text-primary transition-colors">
            {copied ? t('copied') : t('copy')}
          </button>
        </div>
      )}
    </div>
  )
}
'use client'

interface QuickActionsProps {
  onAddTransaction: () => void
  onAddIncome: () => void
  onAddTransfer: () => void
  onAddCommitment: () => void
}

interface ActionDef {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
}

export default function QuickActions({
  onAddTransaction,
  onAddIncome,
  onAddTransfer,
  onAddCommitment,
}: QuickActionsProps) {
  const actions: ActionDef[] = [
    {
      id: 'add-expense',
      label: 'Expense',
      icon: <IconMinus />,
      onClick: onAddTransaction,
    },
    {
      id: 'add-income',
      label: 'Income',
      icon: <IconPlus />,
      onClick: onAddIncome,
    },
    {
      id: 'add-commitment',
      label: 'Commitment',
      icon: <IconCard />,
      onClick: onAddCommitment,
    },
    {
      id: 'add-transfer',
      label: 'Transfer',
      icon: <IconArrows />,
      onClick: onAddTransfer,
    },
  ]

  return (
    <div style={{ marginBottom: 20 }}>
      <div className="c-label" style={{ marginBottom: 10 }}>Quick Actions</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {actions.map(action => (
          <button
            key={action.id}
            id={action.id}
            className="c-action-btn"
            onClick={action.onClick}
          >
            {action.icon}
            + {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function IconPlus() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function IconMinus() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function IconCard() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  )
}

function IconArrows() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" />
      <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  )
}

import type { RecapCategory } from './dataFetchers'

interface FormatOptions {
  data: Record<string, any>
  categories: RecapCategory[]
  periodLabel: string
  periodStart: string
  periodEnd: string
}

export function formatAsMarkdown(opts: FormatOptions): string {
  const { data, periodLabel } = opts
  let md = `# Data Recap — ${periodLabel}\n\n`
  md += `_Generated: ${new Date().toLocaleString('id-ID')}_\n\n`
  md += `---\n\n`

  if (data.finance) {
    const f = data.finance
    md += `## 💰 Finance\n\n`
    md += `- **Total Income:** Rp ${f.summary.income.toLocaleString('id-ID')}\n`
    md += `- **Total Expense:** Rp ${f.summary.expense.toLocaleString('id-ID')}\n`
    md += `- **Net:** Rp ${f.summary.net.toLocaleString('id-ID')}\n`
    md += `- **Transaction Count:** ${f.summary.transactionCount}\n\n`

    if (Object.keys(f.categoryBreakdown).length > 0) {
      md += `### Category Breakdown\n\n`
      md += `| Category | Amount |\n|---|---|\n`
      Object.entries(f.categoryBreakdown)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .forEach(([cat, amount]) => {
          md += `| ${cat} | Rp ${(amount as number).toLocaleString('id-ID')} |\n`
        })
      md += `\n`
    }

    if (Object.keys(f.walletBreakdown).length > 0) {
      md += `### Wallet Movement\n\n`
      md += `| Wallet | Net Change |\n|---|---|\n`
      Object.entries(f.walletBreakdown).forEach(([wallet, amount]) => {
        const n = amount as number
        md += `| ${wallet} | ${n >= 0 ? '+' : ''}Rp ${n.toLocaleString('id-ID')} |\n`
      })
      md += `\n`
    }

    if (f.autoTransactions.length > 0) {
      md += `### Active Automations\n\n`
      f.autoTransactions.forEach((a: any) => {
        md += `- ${a.title}: ${a.type === 'income' ? '+' : '-'}Rp ${Number(a.amount).toLocaleString('id-ID')} (${a.frequency})\n`
      })
      md += `\n`
    }

    if (f.transactions.length > 0) {
      md += `### Transactions (latest 30)\n\n`
      md += `| Date | Type | Amount | Category | Description | Wallet |\n|---|---|---|---|---|---|\n`
      f.transactions
        .filter((t: any) => t.description !== 'SYSTEM_CALIBRATION')
        .slice(0, 30)
        .forEach((t: any) => {
          const date = new Date(t.created_at).toLocaleDateString('id-ID')
          const wallet = t.wallet_name === 'Cashless' || !t.wallet_name ? 'Livin' : t.wallet_name
          md += `| ${date} | ${t.type} | Rp ${Number(t.amount).toLocaleString('id-ID')} | ${t.category || '-'} | ${t.description} | ${wallet} |\n`
        })
      md += `\n`
    }
    md += `---\n\n`
  }

  if (data.cigarettes) {
    const c = data.cigarettes
    md += `## 🚬 Cigarettes\n\n`
    md += `- **Total Smoked:** ${c.summary.totalSmoked} sticks\n`
    md += `- **Average per Day:** ${c.summary.avgPerDay} sticks/day\n`
    md += `- **Days with Data:** ${c.summary.daysWithData}\n`
    md += `- **Self:** ${c.summary.selfCount} | **Shared:** ${c.summary.sharedCount}\n\n`

    if (Object.keys(c.dailyCounts).length > 0) {
      md += `### Daily Breakdown\n\n`
      md += `| Date | Count |\n|---|---|\n`
      Object.entries(c.dailyCounts)
        .sort(([a], [b]) => b.localeCompare(a))
        .forEach(([date, count]) => {
          md += `| ${date} | ${count} |\n`
        })
      md += `\n`
    }

    if (c.packs.length > 0) {
      md += `### Pack Status\n\n`
      c.packs.forEach((p: any) => {
        md += `- ${p.brand}: ${p.remaining_sticks}/${p.initial_sticks} remaining${p.is_active ? ' (active)' : ''}\n`
      })
      md += `\n`
    }
    md += `---\n\n`
  }

  if (data.tasks) {
    const t = data.tasks
    md += `## ✅ Tasks\n\n`
    md += `- **Total:** ${t.summary.total}\n`
    md += `- **Completed:** ${t.summary.completed} (${t.summary.completionRate}%)\n`
    md += `- **Pending:** ${t.summary.pending}\n`
    md += `- **Overdue:** ${t.summary.overdue}\n\n`

    if (t.tasks.length > 0) {
      md += `### Task List\n\n`
      t.tasks.forEach((task: any) => {
        const status = task.is_completed
          ? '✅'
          : (task.due_date && new Date(task.due_date) < new Date() ? '⚠️' : '⬜')
        md += `- ${status} ${task.title}${task.due_date ? ` (due: ${new Date(task.due_date).toLocaleDateString('id-ID')})` : ''}\n`
      })
      md += `\n`
    }
    md += `---\n\n`
  }

  if (data.notes) {
    md += `## 📝 Notes\n\n`
    md += `- **Total:** ${data.notes.summary.total}\n\n`
    data.notes.notes.slice(0, 10).forEach((n: any) => {
      md += `### ${n.title}\n`
      const preview = (n.content ?? '').slice(0, 200)
      md += `${preview}${(n.content?.length ?? 0) > 200 ? '...' : ''}\n\n`
    })
    md += `---\n\n`
  }

  if (data.pomodoro) {
    const p = data.pomodoro
    md += `## ⏱️ Pomodoro / Focus\n\n`
    md += `- **Total Sessions:** ${p.summary.totalSessions}\n`
    md += `- **Total Focus Time:** ${p.summary.totalFocusHours} hours (${p.summary.totalFocusMinutes} min)\n`
    md += `- **Avg Session:** ${p.summary.avgSessionMinutes} min\n\n---\n\n`
  }

  if (data.schedule) {
    md += `## 📅 Schedule\n\n`
    if (data.schedule.schedule.length > 0) {
      data.schedule.schedule.forEach((s: any) => {
        md += `- ${s.day} ${s.start_time}–${s.end_time}: ${s.subject}${s.room ? ` @ ${s.room}` : ''}\n`
      })
    } else {
      md += `_No schedule entries._\n`
    }
    md += `\n---\n\n`
  }

  if (data.inventory) {
    md += `## 📦 Inventory\n\n`
    md += `- **Total Items:** ${data.inventory.summary.total}\n`
    Object.entries(data.inventory.summary.byStatus).forEach(([status, count]) => {
      md += `- **${status}:** ${count}\n`
    })
    md += `\n---\n\n`
  }

  if (data.subscriptions) {
    const s = data.subscriptions
    md += `## 💳 Subscriptions\n\n`
    md += `- **Total Active:** ${s.summary.total}\n`
    md += `- **Total Monthly Cost:** Rp ${s.summary.totalMonthly.toLocaleString('id-ID')}\n\n`
    s.subscriptions.forEach((sub: any) => {
      md += `- ${sub.name}: Rp ${Number(sub.amount).toLocaleString('id-ID')}/month (billing day ${sub.billing_day})\n`
    })
    md += `\n---\n\n`
  }

  if (data.snapshots && data.snapshots.snapshots.length > 0) {
    md += `## 📊 Daily Snapshots\n\n`
    md += `| Date | Net | Cigarettes | Tasks Done | Focus Min |\n|---|---|---|---|---|\n`
    data.snapshots.snapshots.forEach((s: any) => {
      md += `| ${s.date} | Rp ${Number(s.net ?? 0).toLocaleString('id-ID')} | ${s.cigarettes ?? 0} | ${s.tasks_done ?? 0}/${s.tasks_total ?? 0} | ${s.focus_minutes ?? 0} |\n`
    })
    md += `\n`
  }

  md += `\n---\n\n_End of recap. Paste this into any AI assistant for deeper analysis._\n`
  return md
}

export function formatAsJSON(opts: FormatOptions): string {
  const { data, periodLabel, periodStart, periodEnd, categories } = opts
  return JSON.stringify({
    meta: {
      period: periodLabel,
      periodStart,
      periodEnd,
      categories,
      generatedAt: new Date().toISOString(),
    },
    data,
  }, null, 2)
}

import React, { useMemo, useState } from "react";
import Section from "../components/Section.jsx";
import PageHeader from "../components/PageHeader.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useFinance } from "../state/financeStore.jsx";
import { formatMoney, monthKey, todayISO, uid, isActiveInMonth } from "../state/money.js";

function MonthSelect({ value, onChange }) {
  return (
    <select className="input" value={value} onChange={(e)=>onChange(e.target.value)}>
      {Array.from({ length: 18 }).map((_,i)=>{
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const mk = monthKey(d.toISOString().slice(0,10));
        return <option key={mk} value={mk}>{mk}</option>;
      })}
    </select>
  );
}

function prevMonthKey(mk) {
  const [y, m] = mk.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() - 1);
  return monthKey(d.toISOString().slice(0,10));
}

export default function Budget() {
  const { state, dispatch } = useFinance();
  const currency = state.profile.currency || "MAD";
  const [mk, setMk] = useState(monthKey(todayISO()));

  const monthItems = state.monthNeeds?.[mk] || null;
  const hasMonth = Boolean(monthItems);
  const needsItems = monthItems || [];

  const total = useMemo(() => needsItems.reduce((s,n)=>s+Number(n.amount||0),0), [needsItems]);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  function setMonth(items) {
    dispatch({ type:"MONTH_NEEDS_SET", monthKey: mk, items });
  }

  function createFromTemplate() {
    const active = state.needsTemplate.filter(n => isActiveInMonth(n, mk));
    const copied = active.map(n => ({ ...n, id: uid("need") }));
    setMonth(copied);
  }

  function createFromPreviousMonth() {
    const pm = prevMonthKey(mk);
    const prev = state.monthNeeds?.[pm];
    if (!prev) {
      alert(`No needs list found for ${pm}. Create from template first.`);
      return;
    }
    const copied = prev.map(n => ({ ...n, id: uid("need") }));
    setMonth(copied);
  }

  function updateItem(id, patch) {
    if (!hasMonth) return;
    dispatch({ type:"MONTH_NEED_UPDATE", monthKey: mk, id, patch });
  }

  function deleteItem(id) {
    if (!hasMonth) return;
    dispatch({ type:"MONTH_NEED_DELETE", monthKey: mk, id });
  }

  function addItem() {
    if (!hasMonth) return;
    const nm = name.trim();
    const amt = Number(amount||0);
    if (!nm) return;
    dispatch({ type:"MONTH_NEED_ADD", monthKey: mk, item:{ name: nm, amount: amt } });
    setName(""); setAmount("");
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Needs"
        subtitle="Each month is unique. Updating needs here won’t change other months."
        right={<div className="w-40"><MonthSelect value={mk} onChange={setMk} /></div>}
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="text-xs text-app-muted">Baseline (this month)</div>
          <div className="text-xl font-semibold">{formatMoney(total, currency)}</div>
          <div className="text-xs text-app-muted mt-1">
            {hasMonth ? "Month-specific list" : "Not set yet"}
          </div>
        </div>

        <div className="card p-4">
          <div className="text-xs text-app-muted">Create this month</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="btn btn-accent" onClick={createFromTemplate} disabled={hasMonth}>
              Create from template
            </button>
            <button className="btn" onClick={createFromPreviousMonth} disabled={hasMonth}>
              Copy previous month
            </button>
            {hasMonth ? (
              <button className="btn" onClick={()=>{
                if (!confirm("Reset this month? This will overwrite your current list.")) return;
                createFromTemplate();
              }}>
                Reset to template
              </button>
            ) : null}
          </div>
          <div className="text-xs text-app-muted mt-2">
            Tip: Use “Copy previous month” when only one item changes (like ending a subscription).
          </div>
        </div>
      </div>

      <Section title="Items">
        {!hasMonth ? (
          <div className="text-sm text-app-muted">
            Create the month first, then you can edit items.
          </div>
        ) : (
          <>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-app-muted">
                  <tr className="border-b border-app-border">
                    <th className="py-2 text-left">Item</th>
                    <th className="py-2 text-right">Amount</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {needsItems.map((n) => (
                    <tr key={n.id} className="border-b border-app-border/60">
                      <td className="py-2">
                        <input
                          className="input"
                          value={n.name}
                          onChange={(e)=>updateItem(n.id, { name: e.target.value })}
                        />
                      </td>
                      <td className="py-2 text-right">
                        <input
                          className="input text-right"
                          type="number"
                          value={n.amount}
                          onChange={(e)=>updateItem(n.id, { amount: Number(e.target.value||0) })}
                        />
                      </td>
                      <td className="py-2 text-right">
                        <button className="btn" onClick={()=>deleteItem(n.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {needsItems.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-4">
                        <EmptyState
                          title="No needs items yet"
                          hint="Add your baseline costs below (rent, bills, transport...)."
                        />
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <div className="label">New item</div>
                <input className="input" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Example: Rent" />
              </div>
              <div>
                <div className="label">Amount ({currency})</div>
                <input className="input" type="number" value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="0" />
              </div>
              <div className="sm:col-span-3 flex gap-2">
                <button className="btn btn-accent" onClick={addItem}>Add</button>
                <button className="btn" onClick={()=>{ setName(""); setAmount(""); }}>Clear</button>
              </div>
            </div>
          </>
        )}
      </Section>

      <Section title="Template">
        <div className="text-sm text-app-muted">
          The template is just a starting point. Once a month is created, it becomes independent.
        </div>
      </Section>
    </div>
  );
}

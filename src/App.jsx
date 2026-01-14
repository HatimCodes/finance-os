import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Daily from "./pages/Daily.jsx";
import Budget from "./pages/Budget.jsx";
import Buckets from "./pages/Buckets.jsx";
import Debts from "./pages/Debts.jsx";
import Backup from "./pages/Backup.jsx";
import Settings from "./pages/Settings.jsx";
import Setup from "./pages/Setup.jsx";
import { FinanceProvider, useFinance } from "./state/financeStore.jsx";

function Gate({ children }) {
  const { state } = useFinance();
  if (!state.profile?.hasCompletedSetup) return <Navigate to="/setup" replace />;
  return children;
}



function SetupGate() {
  const { state } = useFinance();
  if (state.profile?.hasCompletedSetup) return <Navigate to="/" replace />;
  return <Setup />;
}
export default function App() {
  return (
    <FinanceProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/setup" element={<SetupGate />} />
          <Route
            path="/"
            element={
              <Gate>
                <Dashboard />
              </Gate>
            }
          />
          <Route
            path="/daily"
            element={
              <Gate>
                <Daily />
              </Gate>
            }
          />
          <Route
            path="/budget"
            element={
              <Gate>
                <Budget />
              </Gate>
            }
          />
          <Route
            path="/buckets"
            element={
              <Gate>
                <Buckets />
              </Gate>
            }
          />
          <Route
            path="/debts"
            element={
              <Gate>
                <Debts />
              </Gate>
            }
          />
          <Route
            path="/backup"
            element={
              <Gate>
                <Backup />
              </Gate>
            }
          />
          <Route
            path="/settings"
            element={
              <Gate>
                <Settings />
              </Gate>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </FinanceProvider>
  );
}

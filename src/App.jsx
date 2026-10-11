import { useState, useEffect } from 'react';
import './App.css';
import { sanitizeInput, sendTelemetry } from './utils';

const INITIAL_EXPENSES = [
  {
    id: 'exp-1',
    description: 'Cloud Infrastructure Hosting (AWS)',
    client: 'FinTech Corp',
    category: 'Software & Cloud',
    amount: 149.50,
    date: '2026-10-01',
    isBillable: true
  },
  {
    id: 'exp-2',
    description: 'Ergonomic Standing Desk Converter',
    client: 'Internal Office',
    category: 'Equipment',
    amount: 289.00,
    date: '2026-10-05',
    isBillable: false
  },
  {
    id: 'exp-3',
    description: 'Client Discovery Dinner & Strategy',
    client: 'HealthTech Global',
    category: 'Meals & Travel',
    amount: 84.20,
    date: '2026-10-09',
    isBillable: true
  }
];

export default function App() {
  // Core expense ledger state
  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('freelancer_expenses_ledger');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return INITIAL_EXPENSES;
  });

  // Form State
  const [description, setDescription] = useState('');
  const [client, setClient] = useState('');
  const [category, setCategory] = useState('Software & Cloud');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isBillable, setIsBillable] = useState(false);

  // Unhappy Path & Form Validation State
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [billingFilter, setBillingFilter] = useState('ALL');

  // Network Connectivity State (Unhappy Path handling)
  const [networkCondition, setNetworkCondition] = useState('online'); // 'online' | 'slow_3g' | 'offline'

  // Telemetry event log simulation
  const [telemetryLogs, setTelemetryLogs] = useState([]);

  // Persist to local storage
  useEffect(() => {
    try {
      localStorage.setItem('freelancer_expenses_ledger', JSON.stringify(expenses));
    } catch {
      // Ignore write errors
    }
  }, [expenses]);

  // Log and append telemetry
  const recordTelemetry = (action, meta = {}) => {
    const logItem = sendTelemetry(action, meta);
    setTelemetryLogs(prev => [logItem, ...prev.slice(0, 9)]);
  };

  // Form validation handler
  const validateForm = () => {
    const newErrors = {};

    if (!description.trim()) {
      newErrors.description = 'Expense description is mandatory.';
    } else if (description.trim().length < 3) {
      newErrors.description = 'Description must be at least 3 characters.';
    }

    if (!client.trim()) {
      newErrors.client = 'Client or project name is required.';
    }

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'Please enter a valid positive numeric amount.';
    }

    if (!date) {
      newErrors.date = 'Expense date is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add expense handler with asynchronous simulation for Bad Connectivity / slow 3G
  const handleAddExpense = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      recordTelemetry('Form Validation Failed', { errorCount: Object.keys(errors).length });
      return;
    }

    if (networkCondition === 'offline') {
      alert('Offline Mode: Submission blocked. Please reconnect to submit recorded expenses.');
      return;
    }

    setIsSubmitting(true);
    const simulatedDelay = networkCondition === 'slow_3g' ? 2000 : 350;

    setTimeout(() => {
      // Sanitize all inputs before saving to state (Security Requirement)
      const sanitizedDescription = sanitizeInput(description.trim());
      const sanitizedClient = sanitizeInput(client.trim());

      const newExpense = {
        id: `exp-${Date.now()}`,
        description: sanitizedDescription,
        client: sanitizedClient,
        category,
        amount: parseFloat(amount),
        date,
        isBillable
      };

      setExpenses(prev => [newExpense, ...prev]);

      // Reset form fields
      setDescription('');
      setClient('');
      setAmount('');
      setIsBillable(false);
      setErrors({});
      setIsSubmitting(false);

      recordTelemetry('Created Expense Entry', { id: newExpense.id, amount: newExpense.amount });
    }, simulatedDelay);
  };

  // Delete Expense Handler
  const handleDeleteExpense = (id) => {
    setExpenses(prev => prev.filter(item => item.id !== id));
    recordTelemetry('Deleted Expense Entry', { id });
  };

  // Reset to initial ledger data
  const handleResetData = () => {
    setExpenses(INITIAL_EXPENSES);
    recordTelemetry('Ledger Reset to Seed Data');
  };

  // Filtered expenses based on search & category
  const filteredExpenses = expenses.filter(item => {
    const matchesSearch =
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.client.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'ALL' || item.category === categoryFilter;

    const matchesBilling =
      billingFilter === 'ALL' ||
      (billingFilter === 'BILLABLE' && item.isBillable) ||
      (billingFilter === 'NON_BILLABLE' && !item.isBillable);

    return matchesSearch && matchesCategory && matchesBilling;
  });

  // Calculate aggregates
  const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);
  const billableAmount = expenses
    .filter(item => item.isBillable)
    .reduce((sum, item) => sum + item.amount, 0);
  const nonBillableAmount = totalAmount - billableAmount;

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-left">
          <h1>React Expense Tracker for Freelancers</h1>
          <div className="ticket-tag" aria-label="Ticket ENG-58218 Core Infrastructure Overhaul">
            <span>Ticket: ENG-58218</span>
            <span>•</span>
            <span>Owner: Nisha Sharma [PDIT-INT-1154]</span>
            <span>•</span>
            <span>P1 Priority</span>
          </div>
        </div>

        <div className="header-right">
          <div
            className={`network-badge ${networkCondition === 'slow_3g' ? 'slow' : networkCondition === 'offline' ? 'offline' : ''}`}
            aria-live="polite"
          >
            <span className="network-indicator" aria-hidden="true"></span>
            <span>Network: {networkCondition.toUpperCase()}</span>
          </div>

          <label htmlFor="network-select" className="sr-only">Simulate Network Connectivity Condition</label>
          <select
            id="network-select"
            className="filter-select"
            value={networkCondition}
            onChange={(e) => {
              setNetworkCondition(e.target.value);
              recordTelemetry('Simulated Network Mode Changed', { mode: e.target.value });
            }}
            aria-label="Simulate network conditions like slow 3G or offline"
          >
            <option value="online">Simulate: Normal Network</option>
            <option value="slow_3g">Simulate: Slow 3G (2s Latency)</option>
            <option value="offline">Simulate: Offline Mode</option>
          </select>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleResetData}
            aria-label="Reset expense data back to initial seeds"
          >
            Reset Seed Data
          </button>
        </div>
      </header>

      {/* Aggregate Metrics Bar */}
      <section className="metrics-grid" aria-label="Ledger Financial Summary">
        <div className="metric-card">
          <span className="metric-title">Total Incurred</span>
          <span className="metric-value">${totalAmount.toFixed(2)}</span>
          <span className="metric-sub">{expenses.length} Total Recorded Entries</span>
        </div>
        <div className="metric-card">
          <span className="metric-title">Client Billable</span>
          <span className="metric-value">${billableAmount.toFixed(2)}</span>
          <span className="metric-sub">Invoiced to client contracts</span>
        </div>
        <div className="metric-card">
          <span className="metric-title">Internal / Non-Billable</span>
          <span className="metric-value">${nonBillableAmount.toFixed(2)}</span>
          <span className="metric-sub">Tax deductible overhead</span>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="content-grid">
        {/* Expense Creation Form */}
        <section className="form-card" aria-labelledby="form-heading">
          <h2 id="form-heading">Log Expense Entry</h2>

          <form onSubmit={handleAddExpense} noValidate>
            <div className="form-group">
              <label htmlFor="expense-desc" className="form-label">
                Description *
              </label>
              <input
                id="expense-desc"
                type="text"
                className={`form-input ${errors.description ? 'invalid' : ''}`}
                placeholder="e.g. Figma License / Server Hosting"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                aria-required="true"
                aria-invalid={errors.description ? 'true' : 'false'}
                aria-describedby={errors.description ? 'desc-error' : undefined}
                disabled={isSubmitting}
              />
              {errors.description && (
                <span id="desc-error" className="error-message" role="alert">
                  {errors.description}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="expense-client" className="form-label">
                Client / Project *
              </label>
              <input
                id="expense-client"
                type="text"
                className={`form-input ${errors.client ? 'invalid' : ''}`}
                placeholder="e.g. FinTech Corp or Internal Office"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                aria-required="true"
                aria-invalid={errors.client ? 'true' : 'false'}
                aria-describedby={errors.client ? 'client-error' : undefined}
                disabled={isSubmitting}
              />
              {errors.client && (
                <span id="client-error" className="error-message" role="alert">
                  {errors.client}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="expense-category" className="form-label">
                Category
              </label>
              <select
                id="expense-category"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="Software & Cloud">Software & Cloud</option>
                <option value="Equipment">Equipment</option>
                <option value="Meals & Travel">Meals & Travel</option>
                <option value="Professional Services">Professional Services</option>
                <option value="Office Supplies">Office Supplies</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="expense-amount" className="form-label">
                Amount ($ USD) *
              </label>
              <input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0.01"
                className={`form-input ${errors.amount ? 'invalid' : ''}`}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-required="true"
                aria-invalid={errors.amount ? 'true' : 'false'}
                aria-describedby={errors.amount ? 'amount-error' : undefined}
                disabled={isSubmitting}
              />
              {errors.amount && (
                <span id="amount-error" className="error-message" role="alert">
                  {errors.amount}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="expense-date" className="form-label">
                Date Incurred *
              </label>
              <input
                id="expense-date"
                type="date"
                className={`form-input ${errors.date ? 'invalid' : ''}`}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-required="true"
                aria-invalid={errors.date ? 'true' : 'false'}
                aria-describedby={errors.date ? 'date-error' : undefined}
                disabled={isSubmitting}
              />
              {errors.date && (
                <span id="date-error" className="error-message" role="alert">
                  {errors.date}
                </span>
              )}
            </div>

            <label className="checkbox-group" htmlFor="expense-billable">
              <input
                id="expense-billable"
                type="checkbox"
                checked={isBillable}
                onChange={(e) => setIsBillable(e.target.checked)}
                disabled={isSubmitting}
              />
              <span className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
                Billable to Client
              </span>
            </label>

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              aria-label={isSubmitting ? "Submitting expense record..." : "Record Expense"}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" aria-hidden="true"></span>
                  <span>Saving to Ledger...</span>
                </>
              ) : (
                'Record Expense'
              )}
            </button>
          </form>
        </section>

        {/* Expense Ledger Table & Filter Controls */}
        <section className="list-card" aria-labelledby="ledger-heading">
          <div className="filter-bar">
            <h2 id="ledger-heading" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
              Expense Ledger ({filteredExpenses.length})
            </h2>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
              <label htmlFor="search-input" className="sr-only">Search expenses by description or client</label>
              <input
                id="search-input"
                type="text"
                className="search-input"
                placeholder="Search description or client..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value) {
                    recordTelemetry('Filtered by Search Query', { query: e.target.value });
                  }
                }}
                aria-label="Filter expenses by description or client name"
              />

              <label htmlFor="category-filter" className="sr-only">Filter by category</label>
              <select
                id="category-filter"
                className="filter-select"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  recordTelemetry('Filtered by Category', { category: e.target.value });
                }}
                aria-label="Filter expenses by category"
              >
                <option value="ALL">All Categories</option>
                <option value="Software & Cloud">Software & Cloud</option>
                <option value="Equipment">Equipment</option>
                <option value="Meals & Travel">Meals & Travel</option>
                <option value="Professional Services">Professional Services</option>
                <option value="Office Supplies">Office Supplies</option>
              </select>

              <label htmlFor="billing-filter" className="sr-only">Filter by billing type</label>
              <select
                id="billing-filter"
                className="filter-select"
                value={billingFilter}
                onChange={(e) => {
                  setBillingFilter(e.target.value);
                  recordTelemetry('Filtered by Billable Status', { status: e.target.value });
                }}
                aria-label="Filter expenses by billing type"
              >
                <option value="ALL">All Statuses</option>
                <option value="BILLABLE">Billable Only</option>
                <option value="NON_BILLABLE">Non-Billable Only</option>
              </select>
            </div>
          </div>

          {/* Empty State vs Table Display */}
          {filteredExpenses.length === 0 ? (
            <div className="empty-state" role="status" aria-live="polite">
              <div className="empty-state-icon" aria-hidden="true">📋</div>
              <h3>No data found</h3>
              <p>
                No expense entries match your current search query or active filter settings. Try clearing filters or recording a new expense item.
              </p>
              {(searchQuery || categoryFilter !== 'ALL' || billingFilter !== 'ALL') && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('ALL');
                    setBillingFilter('ALL');
                    recordTelemetry('Cleared All Filters');
                  }}
                  aria-label="Clear all active search and filter constraints"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="expense-table" aria-label="Freelancer expense records">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Description</th>
                    <th scope="col">Client</th>
                    <th scope="col">Category</th>
                    <th scope="col">Billing</th>
                    <th scope="col" style={{ textAlign: 'right' }}>Amount</th>
                    <th scope="col" style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((item) => (
                    <tr key={item.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{item.date}</td>
                      <td style={{ fontWeight: 500 }}>{item.description}</td>
                      <td>{item.client}</td>
                      <td>
                        <span className="badge">{item.category}</span>
                      </td>
                      <td>
                        <span className={`badge ${item.isBillable ? 'billable' : ''}`}>
                          {item.isBillable ? 'Billable' : 'Internal'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        ${item.amount.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-icon-danger"
                          onClick={() => handleDeleteExpense(item.id)}
                          aria-label={`Delete expense entry ${item.description} for $${item.amount}`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Simulated Telemetry Feed Drawer */}
      <footer className="telemetry-card" aria-label="Simulated telemetry stream">
        <div className="telemetry-header">
          <strong>SIMULATED ANALYTICS STREAM (NFR Compliance)</strong>
          <span>Ticket: ENG-58218</span>
        </div>
        <div className="telemetry-logs" aria-live="polite">
          {telemetryLogs.length === 0 ? (
            <div className="telemetry-entry">No interactions recorded yet. Perform an action to stream telemetry.</div>
          ) : (
            telemetryLogs.map((log, index) => (
              <div key={index} className="telemetry-entry">
                <span>[Telemetry]</span> {log}
              </div>
            ))
          )}
        </div>
      </footer>
    </div>
  );
}

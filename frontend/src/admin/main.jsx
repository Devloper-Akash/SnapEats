/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
import React, { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, Bike, Check, ChevronDown,
  ChevronLeft, ChevronRight, CircleDollarSign, ClipboardList, Clock3, LayoutDashboard,
  LogOut, Menu, Search, ShieldCheck, Store, Users, X,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import "./admin.css";

const serverUrl = import.meta.env.VITE_ADMIN_SERVER_URL || (import.meta.env.DEV ? "http://localhost:8000" : import.meta.env.VITE_SERVER_URL || "https://snapeats-backend-g91m.onrender.com");
const api = axios.create({ baseURL: serverUrl, withCredentials: true, timeout: 15000 });
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
const compactNumber = (value) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);
const initials = (name = "Admin") => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

function AdminApp() {
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("Overview");
  const [dashboard, setDashboard] = useState(null);
  const [shops, setShops] = useState([]);
  const [shopMeta, setShopMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [shopStatus, setShopStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [login, setLogin] = useState({ email: "", password: "" });
  const [loginBusy, setLoginBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const checkSession = useCallback(async () => {
    setChecking(true);
    try {
      const { data } = await api.get("/api/admin/me");
      setAdmin(data.admin);
    } catch {
      setAdmin(null);
    } finally {
      setChecking(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/admin/dashboard");
      setDashboard(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your platform overview.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadShops = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/admin/shops", { params: { status: shopStatus, search: query, page, limit: 8 } });
      setShops(data.shops || []);
      setShopMeta(data.pagination || { page: 1, pages: 1, total: 0 });
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load the shop list.");
    } finally {
      setLoading(false);
    }
  }, [shopStatus, query]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { checkSession(); }, [checkSession]);
  useEffect(() => {
    if (!admin) return;
    const timer = window.setTimeout(() => {
      if (activePage === "Overview") loadDashboard();
      if (activePage === "Shops") loadShops(1);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [admin, activePage, loadDashboard, loadShops]);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginBusy(true);
    setError("");
    try {
      await api.post("/api/admin/session/signin", login);
      const { data } = await api.get("/api/admin/me");
      setAdmin(data.admin);
    } catch (err) {
      await api.post("/api/admin/session/signout").catch(() => {});
      const responseMessage = typeof err.response?.data?.message === "string" ? err.response.data.message : "";
      if (responseMessage) setError(responseMessage);
      else if (err.response?.status === 404) setError("The admin sign-in API is not deployed on this backend yet. Deploy the backend admin routes, then try again.");
      else if (err.request) setError("The backend did not respond. Check that it is running and that VITE_SERVER_URL points to it.");
      else setError("Use an active admin account to sign in.");
    } finally {
      setLoginBusy(false);
    }
  };

  const signOut = async () => {
    await api.post("/api/admin/session/signout").catch(() => {});
    setAdmin(null);
    setDashboard(null);
    setActivePage("Overview");
  };

  const updateShop = async (shop, changes) => {
    try {
      await api.patch(`/api/admin/shops/${shop._id}`, changes);
      setNotice(changes.approvalStatus === "approved" ? `${shop.name} approved` : changes.approvalStatus === "rejected" ? `${shop.name} declined` : changes.isSuspended ? `${shop.name} paused` : `${shop.name} updated`);
      if (activePage === "Shops") loadShops(shopMeta.page);
      loadDashboard();
      setRejecting(null);
      setRejectReason("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not update this shop.");
    }
  };

  if (checking) return <div className="admin-loading"><span className="loader-ring" /><span>Opening your workspace…</span></div>;
  if (!admin) return <LoginScreen login={login} setLogin={setLogin} onSubmit={handleLogin} busy={loginBusy} error={error} />;

  const navigation = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Shops", icon: Store, count: dashboard?.metrics?.pendingApprovals },
  ];

  return (
    <div className="admin-app">
      <aside className={`admin-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="brand-lockup">
          <span className="brand-mark"><span>snap</span><b>eats</b></span>
          <span className="admin-pill">ADMIN</span>
          <button className="mobile-close icon-button" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="admin-nav" aria-label="Admin navigation">
          {navigation.map(({ label, icon: Icon, count }) => (
            <button key={label} className={`nav-link ${activePage === label ? "active" : ""}`} onClick={() => { setActivePage(label); setMobileOpen(false); }}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{count > 0 && <b className="nav-count">{count}</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <div className="sidebar-note-icon"><ShieldCheck size={18} /></div>
          <p>Platform operations</p>
          <span>Your control room for the SnapEats network.</span>
        </div>
        <div className="sidebar-bottom"><div className="live-dot" /> All systems operational</div>
      </aside>

      {mobileOpen && <button className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}

      <main className="admin-main">
        <header className="admin-topbar">
          <button className="mobile-menu icon-button" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{activePage}</strong></div>
          <div className="topbar-actions">
            <span className="today-label"><Activity size={15} /> Live overview</span>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button>
            <div className="topbar-divider" />
            <div className="admin-profile"><span className="profile-avatar">{initials(admin.fullName)}</span><div><b>{admin.fullName}</b><small>{admin.adminRole || "Administrator"}</small></div></div>
            <button className="icon-button logout-button" onClick={signOut} title="Sign out" aria-label="Sign out"><LogOut size={17} /></button>
          </div>
        </header>

        <div className="page-content">
          {error && <div className="error-banner"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={16} /></button></div>}
          {activePage === "Overview" ? <Overview data={dashboard} loading={loading} name={admin.fullName} onOpenShops={() => setActivePage("Shops")} /> : (
            <ShopManagement shops={shops} meta={shopMeta} status={shopStatus} setStatus={setShopStatus} search={search} setSearch={setSearch} query={query} setQuery={setQuery} loading={loading} onSearch={() => setQuery(search.trim())} onPage={loadShops} onUpdate={updateShop} onReject={(shop) => { setRejecting(shop); setRejectReason(""); }} />
          )}
        </div>
      </main>

      {notice && <div className="toast"><span className="toast-check"><Check size={15} /></span>{notice}<button onClick={() => setNotice("")} aria-label="Dismiss"><X size={15} /></button></div>}
      {rejecting && <div className="modal-backdrop" onClick={() => setRejecting(null)}><section className="reject-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close icon-button" onClick={() => setRejecting(null)} aria-label="Close"><X size={18} /></button><div className="modal-icon"><Store size={20} /></div>
        <p className="eyebrow">SHOP APPLICATION</p><h2>Decline {rejecting.name}?</h2><p className="modal-copy">Let the owner know what needs to be updated before they can be approved.</p>
        <label className="field-label" htmlFor="rejection-reason">Reason for declining</label><textarea id="rejection-reason" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="For example: business documents are incomplete" rows={3} />
        <div className="modal-actions"><button className="button-secondary" onClick={() => setRejecting(null)}>Go back</button><button className="button-danger" disabled={!rejectReason.trim()} onClick={() => updateShop(rejecting, { approvalStatus: "rejected", rejectionReason: rejectReason })}>Decline shop</button></div>
      </section></div>}
    </div>
  );
}

function LoginScreen({ login, setLogin, onSubmit, busy, error }) {
  return <main className="login-shell">
    <div className="login-decoration login-decoration-one" /><div className="login-decoration login-decoration-two" />
    <section className="login-card">
      <div className="login-brand"><span className="brand-mark"><span>snap</span><b>eats</b></span><span className="admin-pill">ADMIN</span></div>
      <div className="login-icon"><ShieldCheck size={24} /></div>
      <p className="eyebrow">PLATFORM CONTROL</p><h1>Welcome back.</h1><p className="login-description">Sign in to manage the SnapEats network.</p>
      <form onSubmit={onSubmit} className="login-form">
        <label>Email address<input type="email" autoComplete="username" required placeholder="you@snapeats.com" value={login.email} onChange={(event) => setLogin({ ...login, email: event.target.value })} /></label>
        <label>Password<input type="password" autoComplete="current-password" required placeholder="Enter your password" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} /></label>
        {error && <div className="login-error">{error}</div>}
        <button className="login-submit" disabled={busy}>{busy ? "Signing in…" : "Sign in to admin"}<ChevronRight size={17} /></button>
      </form>
      <p className="login-foot"><ShieldCheck size={14} /> Restricted to authorized administrators</p>
    </section>
    <div className="login-caption">GOOD FOOD. GOOD BUSINESS.</div>
  </main>;
}

function Overview({ data, loading, name, onOpenShops }) {
  const metrics = data?.metrics || {};
  const cards = [
    { label: "Total orders", value: compactNumber(metrics.totalOrders), icon: ClipboardList, tint: "peach", change: "All time" },
    { label: "Gross merchandise value", value: money(metrics.gmv), icon: CircleDollarSign, tint: "green", change: "All time" },
    { label: "Commission earned", value: money(metrics.commissionEarned), icon: Activity, tint: "purple", change: "Shop rates applied" },
    { label: "Active shops", value: compactNumber(metrics.activeShops), icon: Store, tint: "amber", change: "Approved & active" },
    { label: "New customers", value: compactNumber(metrics.newUsers), icon: Users, tint: "green", change: "Last 7 days" },
    { label: "Pending approvals", value: compactNumber(metrics.pendingApprovals), icon: Clock3, tint: "peach", change: "Needs your review" },
  ];
  return <>
    <div className="page-heading"><div><p className="eyebrow"><span className="heading-spark">✦</span> PLATFORM PULSE</p><h1>Good morning, <span>{name?.split(" ")[0] || "Admin"}</span><i>.</i></h1><p className="heading-subtitle">Here’s what’s happening across SnapEats today.</p></div><div className="heading-date"><span className="date-dot" /> Updated just now <ChevronDown size={14} /></div></div>
    <section className="metrics-grid">
      {cards.map(({ label, value, icon: Icon, tint, change }) => <article className="metric-card" key={label}>
        <div className="metric-top"><span className={`metric-icon ${tint}`}><Icon size={19} strokeWidth={1.8} /></span><span className="metric-change"><ArrowUpRight size={14} /> {change}</span></div>
        <p className="metric-value">{loading && !data ? <i className="skeleton skeleton-value" /> : value}</p><p className="metric-label">{label}</p>
      </article>)}
    </section>
    <section className="overview-grid">
      <article className="panel sales-panel">
        <div className="panel-heading"><div><p className="eyebrow">PERFORMANCE</p><h2>Sales overview</h2></div><span className="period-select">Last 7 days <ChevronDown size={14} /></span></div>
        <div className="chart-legend"><span><i className="legend-sales" /> Sales</span><span><i className="legend-orders" /> Orders</span></div>
        <div className="chart-wrap">{loading && !data ? <div className="chart-skeleton" /> : <ResponsiveContainer width="100%" height="100%"><AreaChart data={data?.salesTrend || []} margin={{ top: 12, right: 6, left: -18, bottom: 0 }}>
          <defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff6948" stopOpacity={0.18} /><stop offset="100%" stopColor="#ff6948" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid stroke="#f1ebe7" strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="date" tickFormatter={(date) => new Date(`${date}T00:00:00`).toLocaleDateString("en", { weekday: "short" })} axisLine={false} tickLine={false} tick={{ fill: "#a59a93", fontSize: 11, fontFamily: "inherit" }} dy={10} />
          <YAxis tickFormatter={(value) => `₹${compactNumber(value)}`} axisLine={false} tickLine={false} tick={{ fill: "#a59a93", fontSize: 10, fontFamily: "inherit" }} />
          <Tooltip formatter={(value, name) => [name === "sales" ? money(value) : value, name === "sales" ? "Sales" : "Orders"]} labelFormatter={(date) => new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })} contentStyle={{ borderRadius: 12, borderColor: "#f0e7e1", boxShadow: "0 10px 25px #49312112", fontSize: 12 }} />
          <Area type="monotone" dataKey="sales" stroke="#f45b3a" strokeWidth={2.5} fill="url(#salesFill)" activeDot={{ r: 4, strokeWidth: 3, stroke: "#fff" }} />
        </AreaChart></ResponsiveContainer>}</div>
      </article>
      <article className="panel pulse-panel">
        <div className="panel-heading"><div><p className="eyebrow">RIGHT NOW</p><h2>Live operations</h2></div><span className="live-chip"><i /> LIVE</span></div>
        <div className="pulse-stat"><span className="pulse-icon orange"><Bike size={18} /></span><div><b>{metrics.onlineDeliveryBoys || 0}</b><small>Delivery partners online</small></div><span className="pulse-trend"><ArrowUpRight size={15} /></span></div>
        <div className="pulse-stat"><span className="pulse-icon lavender"><ClipboardList size={18} /></span><div><b>{metrics.activeDeliveries || 0}</b><small>Orders in delivery</small></div><span className="pulse-trend"><ArrowUpRight size={15} /></span></div>
        <button className="approval-callout" onClick={onOpenShops}><span className="approval-icon"><Store size={18} /></span><span><b>{metrics.pendingApprovals || 0} shops</b><small>Waiting for your review</small></span><span className="approval-arrow"><ChevronRight size={18} /></span></button>
        <div className="pulse-foot"><span className="live-dot" /> Activity is updating in real time</div>
      </article>
    </section>
    <section className="breakdown-grid">
      <article className="panel breakdown-panel">
        <div className="panel-heading"><div><p className="eyebrow">ORDER HEALTH</p><h2>Orders by status</h2></div><span className="small-panel-count">{compactNumber((data?.ordersByStatus || []).reduce((sum, row) => sum + row.count, 0))} total</span></div>
        <div className="status-breakdown">{(data?.ordersByStatus || []).length ? data.ordersByStatus.map((row) => {
          const total = data.ordersByStatus.reduce((sum, item) => sum + item.count, 0) || 1;
          const tone = String(row._id || "pending").toLowerCase().replaceAll(" ", "-");
          return <div className="status-row" key={row._id}><div className="status-row-head"><span><i className={`status-swatch ${tone}`} />{row._id || "Unknown"}</span><b>{compactNumber(row.count)}</b></div><div className="status-bar"><i className={tone} style={{ width: `${Math.max(3, row.count / total * 100)}%` }} /></div></div>;
        }) : <div className="compact-empty"><ClipboardList size={18} />No order activity yet</div>}</div>
      </article>
      <article className="panel breakdown-panel">
        <div className="panel-heading"><div><p className="eyebrow">TOP PERFORMERS</p><h2>Leading shops</h2></div><Store size={17} className="panel-heading-icon" /></div>
        <TopList rows={data?.topShops || []} kind="shops" />
      </article>
      <article className="panel breakdown-panel">
        <div className="panel-heading"><div><p className="eyebrow">DELIVERY NETWORK</p><h2>Top delivery partners</h2></div><Bike size={17} className="panel-heading-icon" /></div>
        <TopList rows={data?.topDeliveryBoys || []} kind="couriers" />
      </article>
    </section>
    <section className="panel orders-panel">
      <div className="panel-heading"><div><p className="eyebrow">LATEST ACTIVITY</p><h2>Recent orders</h2></div></div>
      <OrdersTable orders={data?.recentOrders || []} loading={loading} />
    </section>
  </>;
}

function TopList({ rows, kind }) {
  if (!rows.length) return <div className="compact-empty"><Users size={18} />No completed activity yet</div>;
  const max = Math.max(...rows.map((row) => kind === "shops" ? row.sales : row.deliveries), 1);
  return <div className="top-list">{rows.map((row, index) => {
    const metric = kind === "shops" ? row.sales : row.deliveries;
    return <div className="top-list-row" key={row._id || row.name}><span className={`rank-badge rank-${index + 1}`}>{index + 1}</span><span className={`top-avatar ${kind}`}>{kind === "shops" ? <Store size={15} /> : initials(row.fullName)}</span><span className="top-row-name"><b>{kind === "shops" ? row.name : row.fullName}</b><small>{kind === "shops" ? `${row.orders} orders` : `${row.deliveries} delivered`}</small></span><span className="top-row-value">{kind === "shops" ? money(metric) : compactNumber(metric)}</span><span className="top-row-bar"><i style={{ width: `${Math.max(8, metric / max * 100)}%` }} /></span></div>;
  })}</div>;
}

function OrdersTable({ orders, loading }) {
  return <div className="table-scroll"><table className="data-table orders-table"><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>SHOP</th><th>DATE</th><th>AMOUNT</th><th>PAYMENT</th><th>STATUS</th></tr></thead><tbody>
    {loading && !orders.length ? Array.from({ length: 4 }, (_, i) => <tr key={i}><td colSpan="7"><i className="skeleton skeleton-row" /></td></tr>) : orders.length ? orders.map((order) => {
      const firstShop = Array.isArray(order.shopOrders) ? order.shopOrders[0] : order.shopOrders;
      const status = String(firstShop?.status || "pending").toLowerCase();
      return <tr key={order._id}><td><b className="order-id">#{String(order._id).slice(-7).toUpperCase()}</b></td><td><span className="customer-name">{order.user?.fullName || "Customer"}</span></td><td>{firstShop?.shop?.name || "—"}</td><td>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</td><td><b>{money(order.totalAmount)}</b></td><td><span className={`payment-tag ${order.paymentMethod === "online" ? "online" : "cod"}`}>{order.paymentMethod === "online" ? "Online" : "Cash"}</span></td><td><span className={`status-tag status-${status.replaceAll(" ", "-")}`}><i />{status}</span></td></tr>;
    }) : <tr><td colSpan="7"><div className="empty-table"><ClipboardList size={22} /><span>No orders to show yet</span></div></td></tr>}
  </tbody></table></div>;
}

function ShopManagement({ shops, meta, status, setStatus, search, setSearch, setQuery, loading, onSearch, onPage, onUpdate, onReject }) {
  const tabs = [["pending", "Pending"], ["approved", "Approved"], ["rejected", "Declined"], ["suspended", "Paused"], ["all", "All shops"]];
  const handleSearch = (event) => { event.preventDefault(); onSearch(); };
  return <>
    <div className="page-heading shop-page-heading"><div><p className="eyebrow"><span className="heading-spark">✦</span> PARTNER NETWORK</p><h1>Shop <span>management</span><i>.</i></h1><p className="heading-subtitle">Review applications and keep the marketplace thriving.</p></div><div className="heading-count"><span>{meta.total}</span> shops in view</div></div>
    <section className="shop-summary-row"><div className="shop-summary-card"><span className="summary-icon pending"><Clock3 size={18} /></span><div><b>{status === "pending" ? meta.total : "—"}</b><small>Awaiting review</small></div></div><div className="shop-summary-card"><span className="summary-icon approved"><Check size={18} /></span><div><b>{status === "approved" ? meta.total : "—"}</b><small>Approved shops</small></div></div><div className="shop-summary-card"><span className="summary-icon total"><Store size={18} /></span><div><b>{status === "all" ? meta.total : "—"}</b><small>Total directory</small></div></div><div className="shop-summary-tip"><span>✦</span><p>Take a moment to review each partner’s details before approving.</p></div></section>
    <section className="panel shops-panel">
      <div className="shops-toolbar"><div className="shop-tabs">{tabs.map(([key, label]) => <button key={key} className={status === key ? "selected" : ""} onClick={() => { setStatus(key); onPage(1); }}>{label}{key === "pending" && status === key && <span>{meta.total}</span>}</button>)}</div>
        <form className="shop-search" onSubmit={handleSearch}><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shops or owners" /><button aria-label="Search"><ChevronRight size={16} /></button></form>
      </div>
      <div className="table-scroll"><table className="data-table shops-table"><thead><tr><th>SHOP</th><th>OWNER</th><th>LOCATION</th><th>SUBMITTED</th><th>COMMISSION</th><th>STATUS</th><th className="actions-head">ACTIONS</th></tr></thead><tbody>
        {loading && !shops.length ? Array.from({ length: 4 }, (_, i) => <tr key={i}><td colSpan="7"><i className="skeleton skeleton-row" /></td></tr>) : shops.length ? shops.map((shop) => <tr key={shop._id}>
          <td><div className="shop-identity">{shop.image ? <img src={shop.image} alt="" /> : <span className="shop-avatar"><Store size={17} /></span>}<div><b>{shop.name}</b><small>{String(shop._id).slice(-7).toUpperCase()}</small></div></div></td>
          <td><div className="owner-cell"><b>{shop.owner?.fullName || "Owner details unavailable"}</b><small>{shop.owner?.email || ""}</small></div></td>
          <td><span>{[shop.city, shop.state].filter(Boolean).join(", ") || "—"}</span></td>
          <td>{new Date(shop.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
          <td><input className="commission-input" type="number" min="0" max="100" step="0.5" aria-label={`Commission rate for ${shop.name}`} defaultValue={shop.commissionRate ?? 10} onBlur={(event) => { const value = Number(event.target.value); if (Number.isFinite(value) && value >= 0 && value <= 100 && value !== Number(shop.commissionRate ?? 10)) onUpdate(shop, { commissionRate: value }); else event.target.value = shop.commissionRate ?? 10; }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /><span className="commission-percent">%</span></td>
          <td><span className={`status-tag ${shop.isSuspended ? "status-suspended" : `status-${shop.approvalStatus || "pending"}`}`}><i />{shop.isSuspended ? "paused" : shop.approvalStatus || "pending"}</span></td>
          <td><div className="row-actions">{(shop.approvalStatus || "pending") === "pending" ? <><button className="action-approve" onClick={() => onUpdate(shop, { approvalStatus: "approved" })}><Check size={14} /> Approve</button><button className="action-decline" onClick={() => onReject(shop)} title="Decline shop"><X size={15} /></button></> : <button className={`action-pause ${shop.isSuspended ? "resume" : ""}`} onClick={() => onUpdate(shop, { isSuspended: !shop.isSuspended })}>{shop.isSuspended ? "Resume" : "Pause"}</button>}</div></td>
        </tr>) : <tr><td colSpan="7"><div className="empty-table"><Store size={22} /><span>No shops match this view</span><button onClick={() => { setSearch(""); setQuery(""); }}>Clear search</button></div></td></tr>}
      </tbody></table></div>
      <div className="table-footer"><span>Showing <b>{shops.length ? (meta.page - 1) * 8 + 1 : 0}–{(meta.page - 1) * 8 + shops.length}</b> of <b>{meta.total}</b> shops</span><div className="pagination"><button disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button><span>Page <b>{meta.page || 1}</b> of {meta.pages || 1}</span><button disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)} aria-label="Next page"><ChevronRight size={17} /></button></div></div>
    </section>
  </>;
}

createRoot(document.getElementById("admin-root")).render(<AdminApp />);

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Link, NavLink, useNavigate, useLocation, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth.jsx';
import { api } from './api.js';
import { SiteProvider, useSite, tel, useT } from './site.jsx';
import Login from './pages/Login.jsx';
import Flow from './pages/Flow.jsx';
import Page from './pages/Page.jsx';
import AdminQuestions from './pages/AdminQuestions.jsx';
import AdminCustomers from './pages/AdminCustomers.jsx';
import AdminCustomer from './pages/AdminCustomer.jsx';
import AdminEmail from './pages/AdminEmail.jsx';
import AdminStripe from './pages/AdminStripe.jsx';
import AdminConsultations from './pages/AdminConsultations.jsx';
import AdminTexts from './pages/AdminTexts.jsx';
import FundingResult from './pages/FundingResult.jsx';
import Plans from './pages/Plans.jsx';
import AdminPages from './pages/AdminPages.jsx';
import AdminSettings from './pages/AdminSettings.jsx';
import AdminMessages from './pages/AdminMessages.jsx';
import AdminServices from './pages/AdminServices.jsx';
import AdminPackages from './pages/AdminPackages.jsx';
import AdminVisitation from './pages/AdminVisitation.jsx';
import AdminChoices from './pages/AdminChoices.jsx';
import AdminCeremony from './pages/AdminCeremony.jsx';
import AdminExtras from './pages/AdminExtras.jsx';
import AdminQty from './pages/AdminQty.jsx';
import Icon from './icons.jsx';
import { PageSkeleton, PlanSkeleton, FullSkeleton } from './Skeleton.jsx';
import Logo from './Logo.jsx';
import './styles.css';
import './iconic.css';
import './admin.css';
import './brand.css';
import './plan.css';
import './polish.css';
import './plans.css';

function SiteNav() {
  const T = useT();
  const { nav } = useSite();
  const { user } = useAuth();
  const groups = [];
  nav.forEach((p) => {
    let g = groups.find((x) => x.name === p.nav_group);
    if (!g) groups.push((g = { name: p.nav_group, items: [] }));
    g.items.push(p);
  });
  return (
    <ul className="menu">
      <li><NavLink to="/" end>{T('nav.home')}</NavLink></li>
      {groups.map((g) => g.name ? (
        <li key={g.name} className="has-sub">
          <button type="button">{g.name} ▾</button>
          <ul className="sub">{g.items.map((p) => <li key={p.slug}><NavLink to={`/${p.slug}`}>{p.title}</NavLink></li>)}</ul>
        </li>
      ) : g.items.map((p) => <li key={p.slug}><NavLink to={`/${p.slug}`}>{p.title}</NavLink></li>))}
      <li className="menu-cta"><NavLink to="/plans" title={user ? T('nav.my_plans_tip') : T('nav.start_tip')}>{user ? T('nav.my_plans') : T('nav.start')}</NavLink></li>
    </ul>
  );
}

function Header() {
  const T = useT();
  const { user, logout } = useAuth();
  const { settings } = useSite();
  const nav = useNavigate();
  const [open, setOpen] = React.useState(false);
  const loc = useLocation();
  React.useEffect(() => setOpen(false), [loc.pathname]);
  // Sticky header: compact once scrolled; slides away while scrolling down and returns on any scroll up.
  const [scrolled, setScrolled] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const headerRef = React.useRef(null);
  const openRef = React.useRef(false);
  openRef.current = open;
  React.useEffect(() => {
    let last = window.scrollY;
    const on = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      const busy = openRef.current || headerRef.current?.contains(document.activeElement); // mobile menu / keyboard focus keep it visible
      if (y <= 160 || busy || y < last - 4) setHidden(false);
      else if (y > last + 4) setHidden(true);
      last = y;
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header ref={headerRef} className={'topbar' + (scrolled ? ' scrolled' : '') + (hidden ? ' hide' : '')}>
      <Link to="/" className="brand" aria-label="Gámez & Sons home"><Logo height="var(--logo-h)" /></Link>
      <button className="burger secondary" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>☰</button>
      <div className={'navwrap' + (open ? ' open' : '')}>
        <SiteNav />
        <div className="account">
          {settings.phone && <a className="call" href={tel(settings.phone)}>{T('nav.call', { phone: settings.phone })}</a>}
          {user
            ? <>
                {user.role === 'admin' && <Link to="/admin">{T('nav.admin')}</Link>}
                <button className="link" onClick={() => { logout(); nav('/'); }}>{T('nav.logout')}</button>
              </>
            : <Link to="/login" className="login-btn" title={T('nav.login_tip')}>{T('nav.login')}</Link>}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const T = useT();
  const { settings: s, nav } = useSite();
  // Group the menu pages by their menu group, then spread the groups over three link columns.
  const groups = [];
  nav.forEach((p) => {
    if (!p.nav_group) return;
    let g = groups.find((x) => x.name === p.nav_group);
    if (!g) groups.push((g = { name: p.nav_group, items: [] }));
    g.items.push(p);
  });
  const cols = [[], [], []];
  groups.forEach((g, i) => cols[i % 3].push(g));
  const year = new Date().getFullYear();

  return (
    <footer className="footer" aria-label="Site footer">
      <div className="footer-cta">
        <div className="footer-in cta-row">
          <div>
            <strong>{T('footer.cta_title')}</strong>
            <span>{T('footer.cta_text')}</span>
          </div>
          <div className="cta-btns">
            <a className="btn gold" href={tel(s.phone)}>{T('footer.cta_call', { phone: s.phone })}</a>
            <Link className="btn outline" to="/plans">{T('footer.cta_plan')}</Link>
          </div>
        </div>
      </div>

      <div className="footer-in footer-cols">
        <div className="f-brand">
          <Link to="/" className="f-logo" aria-label="Gámez & Sons home"><Logo height={96} /></Link>
          <p>{s.tagline}</p>
          {s.facebook && <a className="social" href={s.facebook} target="_blank" rel="noreferrer">Follow us on Facebook</a>}
        </div>

        {cols.map((col, i) => col.length > 0 && (
          <nav key={i} className="f-links" aria-label={col.map((g) => g.name).join(' and ')}>
            {col.map((g) => (
              <div key={g.name}>
                <h2>{g.name}</h2>
                <ul>{g.items.map((p) => <li key={p.slug}><Link to={`/${p.slug}`}>{p.title}</Link></li>)}</ul>
              </div>
            ))}
          </nav>
        ))}

        <address className="f-contact">
          <h2>{T('footer.contact_title')}</h2>
          <ul>
            {s.address && <li><Icon name="home" size={18} /><span>{s.address}</span></li>}
            {s.phone && <li><Icon name="phone" size={18} /><a href={tel(s.phone)}>{s.phone}</a></li>}
            {s.email && <li><Icon name="file" size={18} /><a href={`mailto:${s.email}`}>{s.email}</a></li>}
            {s.hours && <li><Icon name="clock" size={18} /><span>{s.hours}</span></li>}
          </ul>
        </address>
      </div>

      <div className="footer-base">
        <div className="footer-in">
          {s.footer_note && <p className="f-note">{s.footer_note}</p>}
          <div className="f-copy">
            <span>{T('footer.copyright', { year, site: s.site_name })}</span>
            <span className="f-sep" aria-hidden="true">|</span>
            <Link to="/contact-us">{T('footer.contact_link')}</Link>
            <Link to="/login">{T('footer.login_link')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

const FIXED_TITLES = { '/admin/pages': 'Pages', '/admin/settings': 'Site settings', '/admin/messages': 'Messages', '/admin/email': 'Email settings', '/admin/stripe': 'Stripe payments', '/admin/consultations': 'Consultation requests', '/admin/texts': 'Site texts' };

function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = React.useState(false);
  const [screens, setScreens] = React.useState([]); // one link per customer screen, in the order customers see them
  React.useEffect(() => setOpen(false), [loc.pathname, loc.search]);
  React.useEffect(() => {
    const load = () => api('/admin/nav').then(setScreens).catch(() => {});
    load();
    window.addEventListener('admin-nav-refresh', load);
    return () => window.removeEventListener('admin-nav-refresh', load);
  }, []);
  // active when the path matches and, for per-screen links, ?screen= matches too
  const isActive = (to) => {
    const u = new URL(to, 'http://x');
    return loc.pathname === u.pathname && (u.search ? loc.search === u.search : !new URLSearchParams(loc.search).get('screen'));
  };
  const onCustomers = loc.pathname.startsWith('/admin/customers');
  const current = onCustomers ? 'Customers' : screens.find((s) => isActive(s.to))?.label || FIXED_TITLES[loc.pathname] || 'Dashboard';
  return (
    <div className={'admin' + (open ? ' side-open' : '')}>
      <aside className="side" aria-label="Admin navigation">
        <Link to="/admin" className="side-brand" aria-label="Admin dashboard"><span className="side-logo"><Logo height={95} /></span><span>Admin</span></Link>
        <nav>
          <div className="side-group">
            <NavLink to="/admin/customers" className={() => (onCustomers ? 'active' : '')}><Icon name="users" size={18} />Customers &amp; plans</NavLink>
            <NavLink to="/admin/consultations"><Icon name="phone" size={18} />Consultation requests</NavLink>
          </div>
          <div className="side-group">
            <h2>Screens <small>in customer order</small></h2>
            {screens.map((s) => (
              <Link key={s.to} to={s.to} className={(isActive(s.to) ? 'active ' : '') + (s.sub ? 'side-sub' : '')} aria-current={isActive(s.to) ? 'page' : undefined}>
                {s.number ? <span className="num">{s.number}</span> : <span className="num sub-ico"><Icon name="tag" size={14} /></span>}<span className="lbl">{s.label}</span>
              </Link>
            ))}
          </div>
          <div className="side-group">
            <h2>Website</h2>
            <NavLink to="/admin/pages"><Icon name="file" size={18} />Pages</NavLink>
            <NavLink to="/admin/settings"><Icon name="shield" size={18} />Site settings</NavLink>
            <NavLink to="/admin/texts"><Icon name="book" size={18} />Site texts</NavLink>
            <NavLink to="/admin/messages"><Icon name="phone" size={18} />Messages</NavLink>
            <NavLink to="/admin/email"><Icon name="file" size={18} />Email settings</NavLink>
            <NavLink to="/admin/stripe"><Icon name="card" size={18} />Stripe payments</NavLink>
          </div>
        </nav>
        <div className="side-foot">
          <Link to="/" target="_blank">View website ↗</Link>
          <span className="who">{user.name}</span>
          <button className="link" onClick={() => { logout(); nav('/login'); }}>Log out</button>
        </div>
      </aside>
      {open && <button className="scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <div className="admin-main">
        <header className="admin-top">
          <button className="secondary burger-admin" aria-label="Open menu" onClick={() => setOpen(true)}>☰</button>
          <strong>{current}</strong>
        </header>
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}

// One plan in the planner; keyed so switching plans starts clean.
function PlanRoute() {
  const { planId } = useParams();
  return <Flow key={planId} planId={+planId} />;
}

function Guard({ admin, fallback, children }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return admin ? <FullSkeleton /> : (fallback || <PageSkeleton />);
  if (!user) return <Navigate to="/login" replace state={{ needLogin: true, from: loc.pathname }} />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return admin ? <AdminLayout>{children}</AdminLayout> : children;
}

// Public pages get the site header/footer; /admin gets its own dashboard layout.
function Frame({ children }) {
  const inAdmin = useLocation().pathname.startsWith('/admin');
  return inAdmin ? children : <><Header /><main>{children}</main><Footer /></>;
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <SiteProvider>
        <Frame>
          <Routes>
            <Route path="/" element={<Page slug="home" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/plans" element={<Guard><Plans /></Guard>} />
            <Route path="/plan/:planId" element={<Guard fallback={<PlanSkeleton />}><PlanRoute /></Guard>} />
            <Route path="/plan" element={<Navigate to="/plans" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/customers" replace />} />
            <Route path="/admin/pages" element={<Guard admin><AdminPages /></Guard>} />
            <Route path="/admin/settings" element={<Guard admin><AdminSettings /></Guard>} />
            <Route path="/admin/messages" element={<Guard admin><AdminMessages /></Guard>} />
            <Route path="/admin/packages" element={<Guard admin><AdminPackages /></Guard>} />
            <Route path="/admin/visitation" element={<Guard admin><AdminVisitation /></Guard>} />
            <Route path="/admin/choices" element={<Guard admin><AdminChoices /></Guard>} />
            <Route path="/admin/ceremony" element={<Guard admin><AdminCeremony /></Guard>} />
            <Route path="/admin/extras" element={<Guard admin><AdminExtras /></Guard>} />
            <Route path="/admin/qty" element={<Guard admin><AdminQty /></Guard>} />
                        <Route path="/admin/services" element={<Guard admin><AdminServices /></Guard>} />
            <Route path="/admin/questions" element={<Guard admin><AdminQuestions /></Guard>} />
            <Route path="/admin/customers" element={<Guard admin><AdminCustomers /></Guard>} />
            <Route path="/admin/consultations" element={<Guard admin><AdminConsultations /></Guard>} />
            <Route path="/admin/email" element={<Guard admin><AdminEmail /></Guard>} />
            <Route path="/admin/texts" element={<Guard admin><AdminTexts /></Guard>} />
            <Route path="/admin/stripe" element={<Guard admin><AdminStripe /></Guard>} />
            <Route path="/funding/success" element={<Guard><FundingResult /></Guard>} />
            <Route path="/funding/cancel" element={<Guard><FundingResult cancelled /></Guard>} />
            <Route path="/admin/customers/:id" element={<Guard admin><AdminCustomer /></Guard>} />
            <Route path="/admin/submissions" element={<Navigate to="/admin/customers" replace />} />
            <Route path="/admin/review" element={<Navigate to="/admin/customers" replace />} />
            <Route path="/:slug" element={<Page />} />
          </Routes>
        </Frame>
      </SiteProvider>
    </AuthProvider>
  </BrowserRouter>
);

export const getToken = () => localStorage.getItem('token');
export const setToken = (t) => (t ? localStorage.setItem('token', t) : localStorage.removeItem('token'));

// The plan the customer is working on; sent with every planning request.
let activePlan = null;
export const setPlan = (id) => { activePlan = id; };

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(activePlan ? { 'X-Plan-Id': String(activePlan) } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  // admin edits can add, rename or remove screens, so the admin sidebar refreshes its screen list
  if (method !== 'GET' && path.startsWith('/admin')) window.dispatchEvent(new Event('admin-nav-refresh'));
  return data;
}

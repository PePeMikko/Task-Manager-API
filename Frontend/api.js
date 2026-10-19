const BASE_URL = "";
const USE_MOCK = false;

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function request(path, options = {}) {
  if (USE_MOCK) return mockRequest(path, options);

  const res = await fetch(BASE_URL + path, { ...options, headers: authHeaders() });
  let data = null;
  try { data = await res.json(); } catch {}

if (res.status === 401 && localStorage.getItem("token")) {
  clearSession();
  window.location.href = "index.html";
}

  if (!res.ok) throw new Error((data && data.error) || "Request failed");
  return data;
}

export function clearSession() {
  localStorage.removeItem("token"); 
  localStorage.removeItem("username");
}

export const signup = (username, password, confirmPassword) =>
  request("/signup", { method: "POST", body: JSON.stringify({ username, password, confirmPassword }) });

export const login = (username, password) =>
  request("/login", { method: "POST", body: JSON.stringify({ username, password }) });

export const getTasks = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.category) params.set("category", filters.category);
  const qs = params.toString();
  return request(`/tasks${qs ? "?" + qs : ""}`);
};

export const createTask = (task) =>
  request("/tasks", { method: "POST", body: JSON.stringify(task) });

export const updateTask = (id, changes) =>
  request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(changes) });

export const deleteTask = (id) => request(`/tasks/${id}`, { method: "DELETE" });

/* ------------------------------------------------------------------ *
 * Mock backend (browser localStorage). Mirrors the API contract so    *
 * you can build the UI before the real server exists.                 *
 * ------------------------------------------------------------------ */
async function mockRequest(path, options = {}) {
  await new Promise((r) => setTimeout(r, 150)); 

  const method = options.method || "GET";
  const body = options.body ? JSON.parse(options.body) : {};
  const url = new URL(path, "http://mock");
  const db = JSON.parse(localStorage.getItem("mock_db") || '{"users":[],"tasks":[],"nextId":1}');
  const save = () => localStorage.setItem("mock_db", JSON.stringify(db));
  const fail = (message, status) => Object.assign(new Error(message), { status });

  if (url.pathname === "/auth/signup" && method === "POST") {
    if (!body.username || !body.password) throw fail("Username and password are required", 400);
    if (db.users.some((u) => u.username === body.username)) throw fail("Username already taken", 400);
    db.users.push({ username: body.username, password: body.password });
    save();
    return { message: "User created" };
  }

  if (url.pathname === "/auth/login" && method === "POST") {
    const user = db.users.find((u) => u.username === body.username && u.password === body.password);
    if (!user) throw fail("Wrong username or password", 401);
    return { token: "mock-" + user.username };
  }

  const token = localStorage.getItem("token");
  if (!token) throw fail("Not logged in", 401);
  const owner = token.replace("mock-", "");
  const mine = db.tasks.filter((t) => t.owner === owner);
  const strip = ({ owner: _o, ...t }) => t;

  if (url.pathname === "/tasks" && method === "GET") {
    const status = url.searchParams.get("status");
    const category = url.searchParams.get("category");
    return mine
      .filter((t) => (!status || t.status === status) && (!category || t.category === category))
      .map(strip);
  }

  if (url.pathname === "/tasks" && method === "POST") {
    if (!body.title) throw fail("Title is required", 400);
    const task = {
      id: db.nextId++, owner,
      title: body.title, description: body.description || "",
      category: body.category || "", due_date: body.due_date || "", status: "pending",
      created_at: new Date().toISOString(),
    };
    db.tasks.push(task);
    save();
    return strip(task);
  }

  const match = url.pathname.match(/^\/tasks\/(\d+)$/);
  if (match) {
    const task = mine.find((t) => t.id === Number(match[1]));
    if (!task) throw fail("Task not found", 404);

    if (method === "GET") return strip(task);
    if (method === "PUT") {
      for (const key of ["title", "description", "category", "due_date", "status"]) {
        if (body[key] !== undefined) task[key] = body[key];
      }
      save();
      return strip(task);
    }
    if (method === "DELETE") {
      db.tasks = db.tasks.filter((t) => t !== task);
      save();
      return { message: "Task deleted" };
    }
  }

  throw fail("Not found", 404);
}
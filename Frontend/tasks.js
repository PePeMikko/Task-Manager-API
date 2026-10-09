import { getTasks, createTask, updateTask, deleteTask, clearSession } from "not yet made.js";


if (!localStorage.getItem("token")) window.location.href = "index.html";

const $ = (id) => document.getElementById(id);


const tasksContainer = $("task-list");
const statusMsg = $("status-msg");
const filterStatus = $("filter-status");
const filterCategory = $("filter-category");


const taskDialog = $("task-dialog");
const taskForm = $("task-form");
const confirmCloseDialog = $("confirm-close-dialog");
const openTaskFormBtn = $("open-task-form-btn");
const closeTaskFormBtn = $("close-task-form-btn");
const addOrUpdateTaskBtn = $("add-or-update-task-btn");
const cancelBtn = $("cancel-btn");
const discardBtn = $("discard-btn");
const titleInput = $("title-input");
const dateInput = $("date-input");
const descriptionInput = $("description-input");
const categoryInput = $("category-input");
const statusInput = $("status-input");

let taskData = [];      
let currentTask = null; 

$("whoami").textContent = localStorage.getItem("username") || "";
$("logout").addEventListener("click", () => {
  clearSession();
  window.location.href = "index.html";
});


const setMessage = (text, isError = false) => {
  statusMsg.textContent = text;
  statusMsg.classList.toggle("is-error", isError);
};

const showFormError = (message) => {
  const el = taskForm.querySelector(".error");
  el.textContent = message;
  el.hidden = !message;
};


const categoryColor = (name) => {
  if (!name) return "";
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${hash} 55% 45%)`;
};

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};


const loadTasks = async () => {
  setMessage("Loading…");
  try {
    taskData = await getTasks({ status: filterStatus.value, category: filterCategory.value });
    setMessage("");
    updateTaskContainer();
    refreshCategoryOptions();
  } catch (err) {
    setMessage(err.message, true);
  }
};


const refreshCategoryOptions = async () => {
  try {
    const all = await getTasks();
    const categories = [...new Set(all.map((t) => t.category).filter(Boolean))].sort();
    const current = filterCategory.value;
    filterCategory.replaceChildren(new Option("All", ""));
    for (const c of categories) filterCategory.add(new Option(c, c));
    filterCategory.value = categories.includes(current) ? current : "";
  } catch {}
};

const updateTaskContainer = () => {
  tasksContainer.replaceChildren();

  const parts = [filterStatus.value, filterCategory.value].filter(Boolean);
  $("list-title").textContent = parts.length ? `Tasks: ${parts.join(", ")}` : "All tasks";
  $("count").textContent = taskData.length === 1 ? "1 task" : `${taskData.length} tasks`;

  if (!taskData.length) {
    tasksContainer.append(el("li", "empty", parts.length
      ? "No tasks match these filters. Change the filters to see more."
      : "No tasks yet. Select New task to add your first one."));
    return;
  }

  taskData.forEach((task) => tasksContainer.append(renderTask(task)));
};

const renderTask = (task) => {
  const done = task.status === "completed";
  const li = el("li", "task" + (done ? " done" : ""));
  li.style.setProperty("--cat-color", categoryColor(task.category));

  const check = document.createElement("input");
  check.type = "checkbox";
  check.checked = done;
  check.setAttribute("aria-label", `Mark "${task.title}" as ${done ? "pending" : "completed"}`);
  check.addEventListener("change", () => toggleStatus(task, check));


  const body = el("div");
  body.append(el("p", "task-title", task.title));
  if (task.description) body.append(el("p", "task-desc", task.description));
  const meta = el("div", "task-meta");
  if (task.category) meta.append(el("span", "tag", task.category));
  if (task.due_date) {
    meta.append(el("span", "", `Due ${new Date(task.due_date + "T00:00").toLocaleDateString()}`));
  }
  body.append(meta);

  const actions = el("div", "task-actions");
  const editBtn = el("button", "btn ghost small", "Edit");
  editBtn.type = "button";
  editBtn.addEventListener("click", () => editTask(task));
  const delBtn = el("button", "btn ghost small danger", "Delete");
  delBtn.type = "button";
  delBtn.addEventListener("click", () => removeTask(task));
  actions.append(editBtn, delBtn);

  li.append(check, body, actions);
  return li;
};


const toggleStatus = async (task, checkbox) => {
  checkbox.disabled = true;
  try {
    await updateTask(task.id, { status: task.status === "completed" ? "pending" : "completed" });
    await loadTasks();
  } catch (err) {
    setMessage(err.message, true);
    checkbox.checked = task.status === "completed";
    checkbox.disabled = false;
  }
};

const removeTask = async (task) => {
  if (!confirm(`Delete "${task.title}"? This can't be undone.`)) return;
  try {
    await deleteTask(task.id);
    await loadTasks();
  } catch (err) {
    setMessage(err.message, true);
  }
};


const openForm = (task = null) => {
  currentTask = task;
  showFormError("");

  titleInput.value = task?.title ?? "";
  dateInput.value = task?.due_date ?? "";
  descriptionInput.value = task?.description ?? "";
  categoryInput.value = task?.category ?? "";
  statusInput.value = task?.status ?? "pending";

  $("task-form-title").textContent = task ? "Edit task" : "New task";
  addOrUpdateTaskBtn.textContent = task ? "Update task" : "Add task";
  $("status-field").hidden = !task; 

  taskDialog.showModal();
  titleInput.focus();
};

const editTask = (task) => openForm(task);

const reset = () => {
  taskDialog.close();
  currentTask = null;
};

const addOrUpdateTask = async () => {
  if (!titleInput.value.trim()) {
    showFormError("Enter a title for the task.");
    titleInput.focus();
    return;
  }

  const payload = {
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    category: categoryInput.value.trim(),
    due_date: dateInput.value,
  };

  addOrUpdateTaskBtn.disabled = true;
  try {
    if (currentTask) {
      await updateTask(currentTask.id, { ...payload, status: statusInput.value });
    } else {
      await createTask({
        ...payload,
        category: payload.category || undefined,
        due_date: payload.due_date || undefined,
      });
    }
    reset();
    await loadTasks();
  } catch (err) {
    showFormError(err.message);
  } finally {
    addOrUpdateTaskBtn.disabled = false;
  }
};


const hasUnsavedChanges = () => {
  const original = {
    title: currentTask?.title ?? "",
    date: currentTask?.due_date ?? "",
    description: currentTask?.description ?? "",
    category: currentTask?.category ?? "",
    status: currentTask?.status ?? "pending",
  };
  return (
    titleInput.value !== original.title ||
    dateInput.value !== original.date ||
    descriptionInput.value !== original.description ||
    categoryInput.value !== original.category ||
    (currentTask !== null && statusInput.value !== original.status)
  );
};

const requestClose = () => {
  if (hasUnsavedChanges()) {
    confirmCloseDialog.showModal();
  } else {
    reset();
  }
};

openTaskFormBtn.addEventListener("click", () => openForm());
closeTaskFormBtn.addEventListener("click", requestClose);


taskDialog.addEventListener("cancel", (e) => {
  e.preventDefault();
  requestClose();
});

cancelBtn.addEventListener("click", () => confirmCloseDialog.close());

discardBtn.addEventListener("click", () => {
  confirmCloseDialog.close();
  reset();
});

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addOrUpdateTask();
});


filterStatus.addEventListener("change", loadTasks);
filterCategory.addEventListener("change", loadTasks);

loadTasks();
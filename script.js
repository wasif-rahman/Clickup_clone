document.addEventListener("DOMContentLoaded", function () {
  const taskInput = document.getElementById("taskInput");
  const addTaskBtn = document.getElementById("addTaskBtn");
  const categoryInput = document.getElementById("categoryInput");
  const addCategoryBtn = document.getElementById("addCategoryBtn");
  const subcategoryInput = document.getElementById("subcategoryInput");
  const parentCategorySelect = document.getElementById("parentCategorySelect");
  const addSubcategoryBtn = document.getElementById("addSubcategoryBtn");
  const board = document.getElementById("board");


  const editModal = document.getElementById("editModal");
  const closeBtn = document.querySelector(".close-btn");
  const modalTitle = document.getElementById("modalTitle");
  const editInput = document.getElementById("editInput");
  const saveEditBtn = document.getElementById("saveEditBtn");
  const deleteItemBtn = document.getElementById("deleteItemBtn");

  let categories = [];
  let tasks = [];
  let currentSelectedCategoryId = null;
  let currentlyEditing = { type: null, id: null };

  init();

  function init() {
    const saved = localStorage.getItem("clickupCloneData");
    if (saved) {
      const data = JSON.parse(saved);
      categories = data.categories || [];
      tasks = data.tasks || [];
    }

    renderBoard();
    setupListeners();
  }

  function setupListeners() {
    addTaskBtn.addEventListener("click", addTask);
    addCategoryBtn.addEventListener("click", addCategory);
    addSubcategoryBtn.addEventListener("click", addSubcategory);

    taskInput.addEventListener(
      "keypress",
      (e) => e.key === "Enter" && addTask()
    );
    categoryInput.addEventListener(
      "keypress",
      (e) => e.key === "Enter" && addCategory()
    );
    subcategoryInput.addEventListener(
      "keypress",
      (e) => e.key === "Enter" && addSubcategory()
    );

    closeBtn.addEventListener("click", closeModal);
    saveEditBtn.addEventListener("click", saveEdit);
    deleteItemBtn.addEventListener("click", deleteItem);

    window.addEventListener("click", (e) => {
      if (e.target === editModal) closeModal();
    });
  }

  function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    if (!currentSelectedCategoryId) {
      alert("Please select a category first.");
      return;
    }

    const newTask = {
      id: Date.now().toString(),
      text,
      categoryId: currentSelectedCategoryId,
      subcategoryId: null,
    };

    tasks.push(newTask);
    saveData();
    renderBoard();
    taskInput.value = "";
  }

  function addCategory() {
    const name = categoryInput.value.trim();
    if (!name) return;

    const newCategory = {
      id: Date.now().toString(),
      name,
      isSubcategory: false,
      parentId: null,
    };

    categories.push(newCategory);

    if (!currentSelectedCategoryId) {
      currentSelectedCategoryId = newCategory.id;
    }

    saveData();
    renderBoard();
    categoryInput.value = "";
  }

  function addSubcategory() {
    const name = subcategoryInput.value.trim();
    const parentId = parentCategorySelect.value;

    if (!name || !parentId) {
      alert("Select a parent category.");
      return;
    }

    const newSub = {
      id: Date.now().toString(),
      name,
      isSubcategory: true,
      parentId,
    };

    categories.push(newSub);
    saveData();
    renderBoard();
    subcategoryInput.value = "";
  }

  function renderBoard() {
    board.innerHTML = "";
    updateParentCategorySelect();

    const mainCategories = categories.filter((cat) => !cat.isSubcategory);

    mainCategories.forEach((cat) => {
      const categoryDiv = document.createElement("div");
      categoryDiv.className = "category";
      categoryDiv.dataset.categoryId = cat.id;

      if (currentSelectedCategoryId === cat.id) {
        categoryDiv.classList.add("selected-category");
      }

      const header = document.createElement("div");
      header.className = "category-header";
      header.textContent = cat.name;

      const controls = document.createElement("div");
      controls.className = "category-controls";
      controls.innerHTML = `
        <button class="edit-category"><i class="fas fa-pen-to-square"></i></button>
        <button class="delete-category"><i class="fas fa-trash"></i></button>
      `;
      header.appendChild(controls);
      categoryDiv.appendChild(header);

      const taskList = document.createElement("div");
      taskList.className = "task-list";
      const categoryTasks = tasks.filter(
        (t) => t.categoryId === cat.id && !t.subcategoryId
      );

      if (categoryTasks.length) {
        categoryTasks.forEach((t) =>
          taskList.appendChild(createTaskElement(t))
        );
      } else {
        const empty = document.createElement("div");
        empty.className = "empty-message";
        empty.textContent = "No task available";
        taskList.appendChild(empty);
      }

      categoryDiv.appendChild(taskList);

      const subcategories = categories.filter(
        (sub) => sub.parentId === cat.id && sub.isSubcategory
      );

      subcategories.forEach((sub) => {
        const subDiv = document.createElement("div");
        subDiv.className = "subcategory";

        const subHeader = document.createElement("div");
        subHeader.className = "subcategory-header";
        subHeader.textContent = sub.name;

        const subControls = document.createElement("div");
        subControls.className = "subcategory-controls";
        subControls.innerHTML = `
          <button class="edit-subcategory"><i class="fas fa-pen-to-square"></i></button>
          <button class="delete-subcategory"><i class="fas fa-trash"></i></button>
        `;
        subHeader.appendChild(subControls);
        subDiv.appendChild(subHeader);

        const subTaskList = document.createElement("div");
        subTaskList.className = "task-list";

        const subTasks = tasks.filter((t) => t.subcategoryId === sub.id);
        if (subTasks.length) {
          subTasks.forEach((t) =>
            subTaskList.appendChild(createTaskElement(t))
          );
        } else {
          subTaskList.textContent = "No task available";
        }

        subDiv.appendChild(subTaskList);
        categoryDiv.appendChild(subDiv);

        subControls
          .querySelector(".edit-subcategory")
          .addEventListener("click", () => {
            openEditModal("subcategory", sub.id, sub.name);
          });

        subControls
          .querySelector(".delete-subcategory")
          .addEventListener("click", () => {
            deleteSubcategory(sub.id);
          });
      });

      categoryDiv.addEventListener("click", (e) => {
        
        if (e.target.closest(".category-controls button")) return;

        currentSelectedCategoryId = cat.id;
        renderBoard();
      });

      board.appendChild(categoryDiv);

      controls
        .querySelector(".edit-category")
        .addEventListener("click", (e) => {
          e.stopPropagation();
          openEditModal("category", cat.id, cat.name);
        });

      controls
        .querySelector(".delete-category")
        .addEventListener("click", (e) => {
          e.stopPropagation(); 
          deleteCategory(cat.id);
        });
    });
  }


  function createTaskElement(task) {
    const el = document.createElement("div");
    el.className = "task";
    

    const text = document.createElement("span");
    text.textContent = task.text;
    el.appendChild(text);

    const controls = document.createElement("div");
    controls.className = "task-controls";
    controls.innerHTML = `
      <button class="edit-task"><i class="fas fa-pen-to-square"></i></button>
      <button class="delete-task"><i class="fas fa-trash"></i></button>
    `;
    el.appendChild(controls);

    controls
      .querySelector(".edit-task")
      .addEventListener("click", () =>
        openEditModal("task", task.id, task.text)
      );
    controls
      .querySelector(".delete-task")
      .addEventListener("click", () => deleteTask(task.id));

    return el;
  }

  function openEditModal(type, id, value) {
    currentlyEditing = { type, id };
    modalTitle.textContent = `Edit ${type}`;
    editInput.value = value;
    editModal.style.display = "block";
  }

  function closeModal() {
    editModal.style.display = "none";
    currentlyEditing = { type: null, id: null };
  }

  function saveEdit() {
    const newValue = editInput.value.trim();
    if (!newValue) return;

    const { type, id } = currentlyEditing;

    if (type === "task") {
      const task = tasks.find((t) => t.id === id);
      if (task) task.text = newValue;
    } else {
      const category = categories.find((c) => c.id === id);
      if (category) category.name = newValue;
    }

    saveData();
    renderBoard();
    closeModal();
  }

  function deleteItem() {
    const { type, id } = currentlyEditing;

    if (type === "task") {
      deleteTask(id);
    } else if (type === "category") {
      deleteCategory(id);
    } else if (type === "subcategory") {
      deleteSubcategory(id);
    }

    closeModal();
  }

  function deleteTask(taskId) {
    tasks = tasks.filter((t) => t.id !== taskId);
    saveData();
    renderBoard();
  }

  function deleteCategory(categoryId) {
    categories = categories.filter(
      (c) => c.id !== categoryId && c.parentId !== categoryId
    );
    tasks = tasks.filter((t) => t.categoryId !== categoryId);
    saveData();
    renderBoard();
  }

  function deleteSubcategory(subId) {
    categories = categories.filter((c) => c.id !== subId);
    tasks = tasks.filter((t) => t.subcategoryId !== subId);
    saveData();
    renderBoard();
  }

  function updateParentCategorySelect() {
    parentCategorySelect.innerHTML =
      '<option value="">Select parent category (optional)</option>';
    const mainCats = categories.filter((cat) => !cat.isSubcategory);
    mainCats.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name;
      parentCategorySelect.appendChild(opt);
    });
  }

  function saveData() {
    localStorage.setItem(
      "clickupCloneData",
      JSON.stringify({ categories, tasks })
    );
  }
});

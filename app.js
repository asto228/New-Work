/**
 * PULSETASK - Executive Productivity & Todo Dashboard
 * Pure Vanilla JavaScript with LocalStorage Persistence
 */

(function () {
  'use strict';

  // Storage key
  const STORAGE_KEY = 'pulsetask_dashboard_data_v2';

  // Seed sample data for first-time visitors
  const DEFAULT_SEED_TASKS = [
    {
      id: 'task_' + (Date.now() - 3600000 * 24 * 2),
      title: 'Design high-conversion SaaS landing page system',
      description: 'Create dark mode glassmorphism UI mockups with typography scales, hero motion graphics, and interactive pricing tables.',
      category: 'Design',
      priority: 'high',
      dueDate: getRelativeDate(0), // Today
      status: 'in-progress',
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      subtasks: [
        { id: 'sub_1', title: 'Curate color palette & glass glow tokens', completed: true },
        { id: 'sub_2', title: 'Design interactive feature grid cards', completed: true },
        { id: 'sub_3', title: 'Export responsive SVG assets', completed: false }
      ]
    },
    {
      id: 'task_' + (Date.now() - 3600000 * 24),
      title: 'Review production database cluster & backup failover',
      description: 'Run automated failover simulation, verify cross-region replicas, and validate disk IOPS performance metrics.',
      category: 'Work',
      priority: 'high',
      dueDate: getRelativeDate(1), // Tomorrow
      status: 'todo',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      subtasks: [
        { id: 'sub_4', title: 'Verify point-in-time recovery logs', completed: false },
        { id: 'sub_5', title: 'Run failover drill on staging instance', completed: false }
      ]
    },
    {
      id: 'task_' + (Date.now() - 3600000 * 18),
      title: 'Monthly financial budget & investment rebalancing',
      description: 'Review portfolio asset allocations, rebalance index funds, and update quarterly expense spreadsheet.',
      category: 'Finance',
      priority: 'medium',
      dueDate: getRelativeDate(3),
      status: 'todo',
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      subtasks: [
        { id: 'sub_6', title: 'Download credit card statements', completed: true },
        { id: 'sub_7', title: 'Allocate monthly savings contribution', completed: false }
      ]
    },
    {
      id: 'task_' + (Date.now() - 3600000 * 10),
      title: 'High-intensity interval cardio & core workout',
      description: '45-minute sprint interval session followed by mobility stretches and 3L hydration target.',
      category: 'Health',
      priority: 'low',
      dueDate: getRelativeDate(0), // Today
      status: 'completed',
      createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
      subtasks: [
        { id: 'sub_8', title: '10 min warm-up & dynamic stretching', completed: true },
        { id: 'sub_9', title: '30 min sprint intervals', completed: true }
      ]
    },
    {
      id: 'task_' + (Date.now() - 3600000 * 5),
      title: 'Read 2 chapters of System Architecture & Distributed Systems',
      description: 'Take detailed technical notes on consensus algorithms (Raft & Paxos) and write short summary.',
      category: 'Personal',
      priority: 'medium',
      dueDate: getRelativeDate(2),
      status: 'todo',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      subtasks: [
        { id: 'sub_10', title: 'Read Chapter 4: Distributed Consensus', completed: false }
      ]
    }
  ];

  // Helper for generating relative ISO date strings (YYYY-MM-DD)
  function getRelativeDate(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  }

  // Application State
  const state = {
    tasks: [],
    filter: 'all',          // 'all', 'today', 'upcoming', 'important', 'completed'
    category: 'all',        // 'all', 'Work', 'Design', 'Personal', 'Health', 'Finance'
    priorityFilter: 'all',  // 'all', 'high', 'medium', 'low'
    searchQuery: '',
    sortBy: 'createdAt_desc',
    viewMode: 'list',       // 'list' or 'board'
    modalSubtasks: [],
    lastDeletedTask: null   // For undo action
  };

  // DOM Elements Cache
  const elements = {
    greetingText: document.getElementById('greetingText'),
    currentDateText: document.getElementById('currentDateText'),
    searchInput: document.getElementById('searchInput'),
    searchClearBtn: document.getElementById('searchClearBtn'),
    activeSearchTag: document.getElementById('activeSearchTag'),
    activeSearchQuery: document.getElementById('activeSearchQuery'),
    removeSearchFilter: document.getElementById('removeSearchFilter'),
    sortSelect: document.getElementById('sortSelect'),
    listViewBtn: document.getElementById('listViewBtn'),
    boardViewBtn: document.getElementById('boardViewBtn'),
    tasksListView: document.getElementById('tasksListView'),
    tasksBoardView: document.getElementById('tasksBoardView'),
    taskListContainer: document.getElementById('taskListContainer'),
    emptyState: document.getElementById('emptyState'),
    currentViewTitle: document.getElementById('currentViewTitle'),
    filteredCountBadge: document.getElementById('filteredCountBadge'),
    openTaskModalBtn: document.getElementById('openTaskModalBtn'),
    topAddBtn: document.getElementById('topAddBtn'),
    emptyStateCreateBtn: document.getElementById('emptyStateCreateBtn'),
    clearCompletedBtn: document.getElementById('clearCompletedBtn'),

    // Metrics
    metricTotal: document.getElementById('metricTotal'),
    metricPending: document.getElementById('metricPending'),
    metricImportant: document.getElementById('metricImportant'),
    metricRate: document.getElementById('metricRate'),
    circularBar: document.getElementById('circularBar'),
    circularPercent: document.getElementById('circularPercent'),
    metricCompletedSub: document.getElementById('metricCompletedSub'),

    // Badges
    badgeAll: document.getElementById('badgeAll'),
    badgeToday: document.getElementById('badgeToday'),
    badgeUpcoming: document.getElementById('badgeUpcoming'),
    badgeImportant: document.getElementById('badgeImportant'),
    badgeCompleted: document.getElementById('badgeCompleted'),
    catCountWork: document.getElementById('catCountWork'),
    catCountDesign: document.getElementById('catCountDesign'),
    catCountPersonal: document.getElementById('catCountPersonal'),
    catCountHealth: document.getElementById('catCountHealth'),
    catCountFinance: document.getElementById('catCountFinance'),

    // Modal
    taskModalOverlay: document.getElementById('taskModalOverlay'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),
    taskForm: document.getElementById('taskForm'),
    modalTitle: document.getElementById('modalTitle'),
    modalSubtitle: document.getElementById('modalSubtitle'),
    editTaskId: document.getElementById('editTaskId'),
    taskTitleInput: document.getElementById('taskTitleInput'),
    taskDescriptionInput: document.getElementById('taskDescriptionInput'),
    taskCategorySelect: document.getElementById('taskCategorySelect'),
    taskPrioritySelect: document.getElementById('taskPrioritySelect'),
    taskDueDateInput: document.getElementById('taskDueDateInput'),
    taskStatusSelect: document.getElementById('taskStatusSelect'),
    saveBtnText: document.getElementById('saveBtnText'),
    newSubtaskInput: document.getElementById('newSubtaskInput'),
    addSubtaskBtn: document.getElementById('addSubtaskBtn'),
    modalSubtaskList: document.getElementById('modalSubtaskList'),
    modalSubtaskCount: document.getElementById('modalSubtaskCount'),

    // Kanban Columns
    kanbanListTodo: document.getElementById('kanbanListTodo'),
    kanbanListInProgress: document.getElementById('kanbanListInProgress'),
    kanbanListCompleted: document.getElementById('kanbanListCompleted'),
    kanbanCountTodo: document.getElementById('kanbanCountTodo'),
    kanbanCountInProgress: document.getElementById('kanbanCountInProgress'),
    kanbanCountCompleted: document.getElementById('kanbanCountCompleted'),

    // Mobile nav & storage
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    sidebar: document.getElementById('sidebar'),
    storageUsage: document.getElementById('storageUsage'),
    exportDataBtn: document.getElementById('exportDataBtn'),
    importDataTrigger: document.getElementById('importDataTrigger'),
    importFileInput: document.getElementById('importFileInput'),
    resetAllDataBtn: document.getElementById('resetAllDataBtn'),
    toastContainer: document.getElementById('toastContainer'),

    // Pomodoro Timer
    timerDisplay: document.getElementById('timerDisplay'),
    pomodoroMode: document.getElementById('pomodoroMode'),
    startTimerBtn: document.getElementById('startTimerBtn'),
    timerIcon: document.getElementById('timerIcon'),
    resetTimerBtn: document.getElementById('resetTimerBtn'),
    skipTimerBtn: document.getElementById('skipTimerBtn'),

    // Confetti
    confettiCanvas: document.getElementById('confettiCanvas')
  };

  /* ==========================================================================
     STORAGE MANAGEMENT (WebStorage / localStorage)
     ========================================================================== */
  function loadTasksFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        state.tasks = JSON.parse(raw);
      } else {
        // First visit - load rich demo data
        state.tasks = DEFAULT_SEED_TASKS;
        saveTasksToStorage();
      }
    } catch (err) {
      console.error('Failed to load from localStorage:', err);
      state.tasks = DEFAULT_SEED_TASKS;
    }
    updateStorageUsageDisplay();
  }

  function saveTasksToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
      updateStorageUsageDisplay();
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
      showToast('Storage error: could not save data', 'danger');
    }
  }

  function updateStorageUsageDisplay() {
    try {
      const dataStr = localStorage.getItem(STORAGE_KEY) || '';
      const bytes = new Blob([dataStr]).size;
      const kb = (bytes / 1024).toFixed(1);
      if (elements.storageUsage) {
        elements.storageUsage.textContent = `${kb} KB used`;
      }
    } catch (e) {
      if (elements.storageUsage) elements.storageUsage.textContent = 'Active';
    }
  }

  /* ==========================================================================
     GREETING & DATE TIME
     ========================================================================== */
  function updateGreetingAndDate() {
    const now = new Date();
    const hours = now.getHours();
    let greeting = 'Good evening';
    if (hours < 12) {
      greeting = 'Good morning';
    } else if (hours < 17) {
      greeting = 'Good afternoon';
    }
    elements.greetingText.textContent = `${greeting}, Commander 👋`;

    const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
    elements.currentDateText.textContent = now.toLocaleDateString(undefined, options);
  }

  /* ==========================================================================
     FILTERING & SORTING LOGIC
     ========================================================================== */
  function getFilteredAndSortedTasks() {
    const todayStr = new Date().toISOString().split('T')[0];

    let filtered = state.tasks.filter(task => {
      // 1. Sidebar Overview Filter
      if (state.filter === 'today') {
        if (task.dueDate !== todayStr) return false;
      } else if (state.filter === 'upcoming') {
        if (!task.dueDate || task.dueDate <= todayStr || task.status === 'completed') return false;
      } else if (state.filter === 'important') {
        if (task.priority !== 'high') return false;
      } else if (state.filter === 'completed') {
        if (task.status !== 'completed') return false;
      }

      // 2. Category Filter
      if (state.category !== 'all') {
        if (task.category !== state.category) return false;
      }

      // 3. Priority Pill Filter
      if (state.priorityFilter !== 'all') {
        if (task.priority !== state.priorityFilter) return false;
      }

      // 4. Search Query Filter
      if (state.searchQuery.trim() !== '') {
        const query = state.searchQuery.toLowerCase();
        const matchTitle = (task.title || '').toLowerCase().includes(query);
        const matchDesc = (task.description || '').toLowerCase().includes(query);
        const matchCategory = (task.category || '').toLowerCase().includes(query);
        const matchSubtasks = (task.subtasks || []).some(sub => sub.title.toLowerCase().includes(query));
        if (!matchTitle && !matchDesc && !matchCategory && !matchSubtasks) {
          return false;
        }
      }

      return true;
    });

    // Sort items
    filtered.sort((a, b) => {
      switch (state.sortBy) {
        case 'createdAt_desc':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'createdAt_asc':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'dueDate_asc':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        case 'priority_desc': {
          const rank = { high: 3, medium: 2, low: 1 };
          return (rank[b.priority] || 0) - (rank[a.priority] || 0);
        }
        case 'title_asc':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });

    return filtered;
  }

  /* ==========================================================================
     METRICS & BADGES CALCULATION
     ========================================================================== */
  function renderMetricsAndBadges() {
    const todayStr = new Date().toISOString().split('T')[0];
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.status === 'completed').length;
    const pending = total - completed;
    const highPriority = state.tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;
    const todayCount = state.tasks.filter(t => t.dueDate === todayStr).length;
    const upcomingCount = state.tasks.filter(t => t.dueDate && t.dueDate > todayStr && t.status !== 'completed').length;

    // Metric Cards
    elements.metricTotal.textContent = total;
    elements.metricPending.textContent = pending;
    elements.metricImportant.textContent = highPriority;

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    elements.metricRate.textContent = rate;
    elements.circularPercent.textContent = `${rate}%`;
    elements.metricCompletedSub.textContent = `${completed} tasks done`;

    // SVG Circular Progress (2 * PI * 34 ≈ 213.63)
    const circumference = 213.63;
    const offset = circumference - (rate / 100) * circumference;
    elements.circularBar.style.strokeDashoffset = offset;

    // Sidebar Badges
    elements.badgeAll.textContent = total;
    elements.badgeToday.textContent = todayCount;
    elements.badgeUpcoming.textContent = upcomingCount;
    elements.badgeImportant.textContent = highPriority;
    elements.badgeCompleted.textContent = completed;

    // Category Counts
    const catCounts = { Work: 0, Design: 0, Personal: 0, Health: 0, Finance: 0 };
    state.tasks.forEach(t => {
      if (catCounts[t.category] !== undefined) catCounts[t.category]++;
    });
    elements.catCountWork.textContent = catCounts.Work;
    elements.catCountDesign.textContent = catCounts.Design;
    elements.catCountPersonal.textContent = catCounts.Personal;
    elements.catCountHealth.textContent = catCounts.Health;
    elements.catCountFinance.textContent = catCounts.Finance;
  }

  /* ==========================================================================
     RENDER LIST VIEW
     ========================================================================= */
  function renderListView(tasks) {
    elements.taskListContainer.innerHTML = '';

    if (tasks.length === 0) {
      elements.emptyState.style.display = 'flex';
      elements.tasksListView.style.display = 'none';
      return;
    }

    elements.emptyState.style.display = 'none';
    elements.tasksListView.style.display = 'block';

    const todayStr = new Date().toISOString().split('T')[0];

    tasks.forEach(task => {
      const isCompleted = task.status === 'completed';
      const card = document.createElement('div');
      card.className = `task-card priority-${task.priority} ${isCompleted ? 'completed' : ''}`;
      card.dataset.id = task.id;

      // Due date formatting & status
      let dueDateBadge = '';
      if (task.dueDate) {
        let dateClass = '';
        let dateLabel = task.dueDate;
        if (task.dueDate < todayStr && !isCompleted) {
          dateClass = 'overdue';
          dateLabel = `Overdue (${task.dueDate})`;
        } else if (task.dueDate === todayStr) {
          dateClass = 'today';
          dateLabel = 'Due Today';
        }
        dueDateBadge = `
          <div class="meta-due-date ${dateClass}">
            <i class="fa-regular fa-calendar"></i>
            <span>${escapeHTML(dateLabel)}</span>
          </div>
        `;
      }

      // Subtasks computation
      let subtasksBadge = '';
      let subtasksSection = '';
      const subtasks = task.subtasks || [];
      if (subtasks.length > 0) {
        const doneCount = subtasks.filter(s => s.completed).length;
        const percent = Math.round((doneCount / subtasks.length) * 100);
        subtasksBadge = `
          <div class="subtasks-mini-progress">
            <i class="fa-solid fa-list-check"></i>
            <span>${doneCount}/${subtasks.length}</span>
            <div class="subtasks-mini-bar-bg">
              <div class="subtasks-mini-bar-fill" style="width: ${percent}%;"></div>
            </div>
          </div>
        `;

        // Render checklist items
        const subtaskItems = subtasks.map(s => `
          <li class="card-subtask-item ${s.completed ? 'done' : ''}" data-subtask-id="${s.id}">
            <div class="card-subtask-checkbox" role="button" aria-label="Toggle subtask">
              <i class="fa-solid fa-check"></i>
            </div>
            <span>${escapeHTML(s.title)}</span>
          </li>
        `).join('');

        subtasksSection = `
          <div class="task-checklist-accordion">
            <button type="button" class="checklist-toggle-btn">
              <i class="fa-solid fa-chevron-down"></i> Subtasks (${doneCount}/${subtasks.length})
            </button>
            <ul class="card-subtasks-list">
              ${subtaskItems}
            </ul>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="task-checkbox-wrap">
          <div class="task-checkbox" role="button" title="${isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}">
            <i class="fa-solid fa-check"></i>
          </div>
        </div>

        <div class="task-main">
          <div class="task-headline-row">
            <h3 class="task-title">${escapeHTML(task.title)}</h3>
            <div class="task-actions">
              <button class="action-btn edit-btn" title="Edit Task">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="action-btn delete-btn" title="Delete Task">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>

          ${task.description ? `<p class="task-description">${escapeHTML(task.description)}</p>` : ''}

          <div class="task-meta-row">
            <span class="badge-tag badge-cat-${task.category}">
              <i class="fa-solid fa-folder"></i> ${escapeHTML(task.category)}
            </span>
            <span class="badge-tag badge-prio-${task.priority}">
              <i class="fa-solid fa-flag"></i> ${task.priority.toUpperCase()}
            </span>
            ${dueDateBadge}
            ${subtasksBadge}
          </div>

          ${subtasksSection}
        </div>
      `;

      // Event: Main Checkbox Toggle
      const checkbox = card.querySelector('.task-checkbox');
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTaskCompletion(task.id);
      });

      // Event: Edit Button
      const editBtn = card.querySelector('.edit-btn');
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditTaskModal(task.id);
      });

      // Event: Delete Button
      const deleteBtn = card.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(task.id);
      });

      // Event: Subtask item toggle
      const subtaskElements = card.querySelectorAll('.card-subtask-item');
      subtaskElements.forEach(item => {
        const subId = item.dataset.subtaskId;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleSubtaskCompletion(task.id, subId);
        });
      });

      elements.taskListContainer.appendChild(card);
    });
  }

  /* ==========================================================================
     RENDER KANBAN BOARD VIEW
     ========================================================================== */
  function renderBoardView(tasks) {
    elements.kanbanListTodo.innerHTML = '';
    elements.kanbanListInProgress.innerHTML = '';
    elements.kanbanListCompleted.innerHTML = '';

    if (tasks.length === 0) {
      elements.emptyState.style.display = 'flex';
      elements.tasksBoardView.style.display = 'none';
      return;
    }

    elements.emptyState.style.display = 'none';
    elements.tasksBoardView.style.display = 'block';

    let countTodo = 0;
    let countInProg = 0;
    let countComp = 0;

    tasks.forEach(task => {
      const card = document.createElement('div');
      card.className = 'kanban-card';
      card.draggable = true;
      card.dataset.id = task.id;

      card.innerHTML = `
        <div class="kanban-card-title">${escapeHTML(task.title)}</div>
        ${task.description ? `<div class="kanban-card-desc">${escapeHTML(task.description)}</div>` : ''}
        <div class="kanban-card-footer">
          <span class="badge-tag badge-cat-${task.category}">${escapeHTML(task.category)}</span>
          <span class="badge-tag badge-prio-${task.priority}">${task.priority.toUpperCase()}</span>
        </div>
      `;

      // Drag & Drop handlers
      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', task.id);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });

      // Click to edit
      card.addEventListener('click', () => {
        openEditTaskModal(task.id);
      });

      if (task.status === 'in-progress') {
        elements.kanbanListInProgress.appendChild(card);
        countInProg++;
      } else if (task.status === 'completed') {
        elements.kanbanListCompleted.appendChild(card);
        countComp++;
      } else {
        elements.kanbanListTodo.appendChild(card);
        countTodo++;
      }
    });

    elements.kanbanCountTodo.textContent = countTodo;
    elements.kanbanCountInProgress.textContent = countInProg;
    elements.kanbanCountCompleted.textContent = countComp;
  }

  function setupKanbanDropzones() {
    const columns = [
      { element: elements.kanbanListTodo, status: 'todo' },
      { element: elements.kanbanListInProgress, status: 'in-progress' },
      { element: elements.kanbanListCompleted, status: 'completed' }
    ];

    columns.forEach(col => {
      col.element.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.element.classList.add('kanban-dropzone-active');
      });

      col.element.addEventListener('dragleave', () => {
        col.element.classList.remove('kanban-dropzone-active');
      });

      col.element.addEventListener('drop', (e) => {
        e.preventDefault();
        col.element.classList.remove('kanban-dropzone-active');
        const taskId = e.dataTransfer.getData('text/plain');
        if (!taskId) return;

        const targetTask = state.tasks.find(t => t.id === taskId);
        if (targetTask && targetTask.status !== col.status) {
          targetTask.status = col.status;
          saveTasksToStorage();
          renderDashboard();
          showToast(`Task moved to ${col.status.toUpperCase()}`, 'info');

          if (col.status === 'completed') {
            triggerConfetti();
          }
        }
      });
    });
  }

  /* ==========================================================================
     MAIN RENDER FUNCTION
     ========================================================================== */
  function renderDashboard() {
    const filteredTasks = getFilteredAndSortedTasks();

    // Update headline info
    let title = 'All Tasks';
    if (state.filter === 'today') title = 'Tasks Due Today';
    else if (state.filter === 'upcoming') title = 'Upcoming Schedule';
    else if (state.filter === 'important') title = 'High Priority Focus';
    else if (state.filter === 'completed') title = 'Completed Archive';

    if (state.category !== 'all') {
      title += ` • ${state.category}`;
    }

    elements.currentViewTitle.textContent = title;
    elements.filteredCountBadge.textContent = `${filteredTasks.length} ${filteredTasks.length === 1 ? 'task' : 'tasks'}`;

    // Search chip display
    if (state.searchQuery.trim() !== '') {
      elements.activeSearchTag.style.display = 'flex';
      elements.activeSearchQuery.textContent = state.searchQuery;
      elements.searchClearBtn.style.display = 'block';
    } else {
      elements.activeSearchTag.style.display = 'none';
      elements.searchClearBtn.style.display = 'none';
    }

    // Render active view
    if (state.viewMode === 'list') {
      elements.tasksBoardView.style.display = 'none';
      renderListView(filteredTasks);
    } else {
      elements.tasksListView.style.display = 'none';
      renderBoardView(filteredTasks);
    }

    renderMetricsAndBadges();
  }

  /* ==========================================================================
     TASK CRUD OPERATIONS
     ========================================================================== */
  function toggleTaskCompletion(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.status === 'completed') {
      task.status = 'todo';
      showToast('Task marked active', 'info');
    } else {
      task.status = 'completed';
      // Mark subtasks done
      if (task.subtasks) {
        task.subtasks.forEach(s => s.completed = true);
      }
      playSoftChime();
      triggerConfetti();
      showToast('Task completed! Keep up the momentum 🎉', 'success');
    }

    saveTasksToStorage();
    renderDashboard();
  }

  function toggleSubtaskCompletion(taskId, subtaskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;

    const sub = task.subtasks.find(s => s.id === subtaskId);
    if (!sub) return;

    sub.completed = !sub.completed;

    // If all subtasks completed, mark task completed
    const allDone = task.subtasks.every(s => s.completed);
    if (allDone && task.status !== 'completed') {
      task.status = 'completed';
      triggerConfetti();
    }

    saveTasksToStorage();
    renderDashboard();
  }

  function deleteTask(taskId) {
    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    state.lastDeletedTask = {
      task: state.tasks[taskIndex],
      index: taskIndex
    };

    state.tasks.splice(taskIndex, 1);
    saveTasksToStorage();
    renderDashboard();

    showToast('Task deleted', 'warning', true);
  }

  function undoLastDelete() {
    if (!state.lastDeletedTask) return;
    state.tasks.splice(state.lastDeletedTask.index, 0, state.lastDeletedTask.task);
    state.lastDeletedTask = null;
    saveTasksToStorage();
    renderDashboard();
    showToast('Task restored', 'success');
  }

  function clearCompletedTasks() {
    const completedCount = state.tasks.filter(t => t.status === 'completed').length;
    if (completedCount === 0) {
      showToast('No completed tasks to clear', 'info');
      return;
    }

    if (confirm(`Are you sure you want to remove ${completedCount} completed task(s)?`)) {
      state.tasks = state.tasks.filter(t => t.status !== 'completed');
      saveTasksToStorage();
      renderDashboard();
      showToast(`Cleared ${completedCount} completed task(s)`, 'success');
    }
  }

  /* ==========================================================================
     MODAL CONTROLLER (CREATE & EDIT)
     ========================================================================== */
  function openCreateTaskModal() {
    elements.taskForm.reset();
    elements.editTaskId.value = '';
    elements.modalTitle.textContent = 'Create New Task';
    elements.modalSubtitle.textContent = 'Specify parameters, category, and deliverables.';
    elements.saveBtnText.textContent = 'Save Task';
    elements.taskDueDateInput.value = getRelativeDate(0); // Default to today
    elements.taskPrioritySelect.value = 'medium';
    elements.taskStatusSelect.value = 'todo';
    elements.taskCategorySelect.value = 'Work';

    state.modalSubtasks = [];
    renderModalSubtasks();

    elements.taskModalOverlay.classList.add('open');
    setTimeout(() => elements.taskTitleInput.focus(), 100);
  }

  function openEditTaskModal(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    elements.editTaskId.value = task.id;
    elements.modalTitle.textContent = 'Edit Task';
    elements.modalSubtitle.textContent = 'Update specifics and manage subtasks.';
    elements.saveBtnText.textContent = 'Update Task';

    elements.taskTitleInput.value = task.title || '';
    elements.taskDescriptionInput.value = task.description || '';
    elements.taskCategorySelect.value = task.category || 'Work';
    elements.taskPrioritySelect.value = task.priority || 'medium';
    elements.taskDueDateInput.value = task.dueDate || '';
    elements.taskStatusSelect.value = task.status || 'todo';

    // Clone subtasks for local modal editing
    state.modalSubtasks = JSON.parse(JSON.stringify(task.subtasks || []));
    renderModalSubtasks();

    elements.taskModalOverlay.classList.add('open');
    setTimeout(() => elements.taskTitleInput.focus(), 100);
  }

  function closeModal() {
    elements.taskModalOverlay.classList.remove('open');
    elements.taskForm.reset();
    state.modalSubtasks = [];
  }

  function renderModalSubtasks() {
    elements.modalSubtaskList.innerHTML = '';
    elements.modalSubtaskCount.textContent = `${state.modalSubtasks.length} items`;

    state.modalSubtasks.forEach((sub, index) => {
      const li = document.createElement('li');
      li.className = 'modal-subtask-item';
      li.innerHTML = `
        <div class="modal-subtask-text">
          <i class="fa-solid fa-check-circle" style="color: ${sub.completed ? '#10b981' : '#64748b'};"></i>
          <span>${escapeHTML(sub.title)}</span>
        </div>
        <button type="button" class="delete-subtask-btn" title="Remove Subtask" data-index="${index}">
          <i class="fa-solid fa-trash"></i>
        </button>
      `;

      li.querySelector('.delete-subtask-btn').addEventListener('click', () => {
        state.modalSubtasks.splice(index, 1);
        renderModalSubtasks();
      });

      elements.modalSubtaskList.appendChild(li);
    });
  }

  function addSubtaskToModal() {
    const title = elements.newSubtaskInput.value.trim();
    if (!title) return;

    state.modalSubtasks.push({
      id: 'sub_' + Date.now() + Math.random().toString(36).substr(2, 4),
      title: title,
      completed: false
    });

    elements.newSubtaskInput.value = '';
    renderModalSubtasks();
    elements.newSubtaskInput.focus();
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    const title = elements.taskTitleInput.value.trim();
    if (!title) {
      showToast('Please enter a task title', 'warning');
      return;
    }

    const editId = elements.editTaskId.value;

    if (editId) {
      // Update existing
      const task = state.tasks.find(t => t.id === editId);
      if (task) {
        task.title = title;
        task.description = elements.taskDescriptionInput.value.trim();
        task.category = elements.taskCategorySelect.value;
        task.priority = elements.taskPrioritySelect.value;
        task.dueDate = elements.taskDueDateInput.value;
        task.status = elements.taskStatusSelect.value;
        task.subtasks = state.modalSubtasks;

        showToast('Task updated successfully', 'success');
      }
    } else {
      // Create new
      const newTask = {
        id: 'task_' + Date.now(),
        title: title,
        description: elements.taskDescriptionInput.value.trim(),
        category: elements.taskCategorySelect.value,
        priority: elements.taskPrioritySelect.value,
        dueDate: elements.taskDueDateInput.value,
        status: elements.taskStatusSelect.value,
        createdAt: new Date().toISOString(),
        subtasks: state.modalSubtasks
      };

      state.tasks.unshift(newTask);
      showToast('New task created', 'success');
    }

    saveTasksToStorage();
    renderDashboard();
    closeModal();
  }

  /* ==========================================================================
     FOCUS POMODORO TIMER
     ========================================================================== */
  let timerInterval = null;
  let timerSecondsLeft = 25 * 60;
  let isTimerRunning = false;
  let currentTimerMode = 'focus'; // 'focus' or 'break'

  function updateTimerDisplay() {
    const mins = Math.floor(timerSecondsLeft / 60);
    const secs = timerSecondsLeft % 60;
    elements.timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function toggleTimer() {
    if (isTimerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  }

  function startTimer() {
    if (isTimerRunning) return;
    isTimerRunning = true;
    elements.timerIcon.className = 'fa-solid fa-pause';

    timerInterval = setInterval(() => {
      if (timerSecondsLeft > 0) {
        timerSecondsLeft--;
        updateTimerDisplay();
      } else {
        // Mode completed
        pauseTimer();
        playSoftChime();
        if (currentTimerMode === 'focus') {
          showToast('Focus session complete! Take a 5-minute break.', 'success');
          triggerConfetti();
          switchTimerMode('break');
        } else {
          showToast('Break finished! Ready to refocus?', 'info');
          switchTimerMode('focus');
        }
      }
    }, 1000);
  }

  function pauseTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
    elements.timerIcon.className = 'fa-solid fa-play';
  }

  function resetTimer() {
    pauseTimer();
    timerSecondsLeft = currentTimerMode === 'focus' ? 25 * 60 : 5 * 60;
    updateTimerDisplay();
  }

  function switchTimerMode(mode) {
    pauseTimer();
    currentTimerMode = mode;
    if (mode === 'focus') {
      timerSecondsLeft = 25 * 60;
      elements.pomodoroMode.textContent = 'Focus';
      elements.pomodoroMode.style.background = 'rgba(99, 102, 241, 0.2)';
      elements.pomodoroMode.style.color = '#c7d2fe';
    } else {
      timerSecondsLeft = 5 * 60;
      elements.pomodoroMode.textContent = 'Break';
      elements.pomodoroMode.style.background = 'rgba(16, 185, 129, 0.2)';
      elements.pomodoroMode.style.color = '#a7f3d0';
    }
    updateTimerDisplay();
  }

  /* ==========================================================================
     DATA EXPORT, IMPORT & FACTORY RESET
     ========================================================================== */
  function exportTasksJSON() {
    try {
      const dataStr = JSON.stringify(state.tasks, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `pulsetask-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Data exported successfully', 'success');
    } catch (err) {
      showToast('Export failed', 'danger');
    }
  }

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          state.tasks = imported;
          saveTasksToStorage();
          renderDashboard();
          showToast(`Imported ${imported.length} tasks successfully`, 'success');
        } else {
          showToast('Invalid JSON file format', 'danger');
        }
      } catch (err) {
        showToast('Error parsing JSON backup', 'danger');
      }
    };
    reader.readAsText(file);
    elements.importFileInput.value = '';
  }

  function resetToDemoData() {
    if (confirm('Reset all tasks to the demo showcase set? This replaces current tasks.')) {
      state.tasks = JSON.parse(JSON.stringify(DEFAULT_SEED_TASKS));
      saveTasksToStorage();
      renderDashboard();
      showToast('Showcase demo data restored', 'info');
    }
  }

  /* ==========================================================================
     AUDIO CHIME & CONFETTI CELEBRATION
     ========================================================================== */
  function playSoftChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.1);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.1);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch (e) {
      // Audio not permitted or supported
    }
  }

  // Pure Canvas Confetti
  let confettiParticles = [];
  let confettiAnimationId = null;

  function triggerConfetti() {
    const canvas = elements.confettiCanvas;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#a855f7'];
    confettiParticles = [];

    for (let i = 0; i < 90; i++) {
      confettiParticles.push({
        x: canvas.width / 2 + (Math.random() * 300 - 150),
        y: canvas.height / 3 + (Math.random() * 100 - 50),
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.7) * 14,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);

    function update() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      for (let p of confettiParticles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // Gravity
        p.rot += p.rotSpeed;
        p.opacity -= 0.012;

        if (p.opacity > 0 && p.y < canvas.height) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rot * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
          ctx.restore();
        }
      }

      if (alive) {
        confettiAnimationId = requestAnimationFrame(update);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    update();
  }

  /* ==========================================================================
     TOAST NOTIFICATIONS
     ========================================================================== */
  function showToast(message, type = 'info', allowUndo = false) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    else if (type === 'warning') icon = 'fa-triangle-exclamation';
    else if (type === 'danger') icon = 'fa-circle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${icon} toast-icon"></i>
      <span>${escapeHTML(message)}</span>
      ${allowUndo ? '<button type="button" class="toast-undo-btn">Undo</button>' : ''}
    `;

    if (allowUndo) {
      toast.querySelector('.toast-undo-btn').addEventListener('click', () => {
        undoLastDelete();
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      });
    }

    elements.toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  /* ==========================================================================
     HELPERS & UTILITIES
     ========================================================================== */
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ==========================================================================
     EVENT LISTENERS & BINDINGS
     ========================================================================== */
  function bindEvents() {
    // Search input
    elements.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      renderDashboard();
    });

    elements.searchClearBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      renderDashboard();
    });

    elements.removeSearchFilter.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      renderDashboard();
    });

    // View toggle buttons
    elements.listViewBtn.addEventListener('click', () => {
      state.viewMode = 'list';
      elements.listViewBtn.classList.add('active');
      elements.boardViewBtn.classList.remove('active');
      renderDashboard();
    });

    elements.boardViewBtn.addEventListener('click', () => {
      state.viewMode = 'board';
      elements.boardViewBtn.classList.add('active');
      elements.listViewBtn.classList.remove('active');
      renderDashboard();
    });

    // Sort select
    elements.sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderDashboard();
    });

    // Priority filter pills
    const priorityPills = document.querySelectorAll('.priority-pill');
    priorityPills.forEach(pill => {
      pill.addEventListener('click', () => {
        priorityPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.priorityFilter = pill.dataset.priority;
        renderDashboard();
      });
    });

    // Sidebar Overview navigation items
    const navItems = document.querySelectorAll('.nav-item[data-filter]');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        state.filter = item.dataset.filter;
        renderDashboard();

        // Close mobile sidebar if open
        elements.sidebar.classList.remove('mobile-open');
      });
    });

    // Sidebar Category navigation items
    const catItems = document.querySelectorAll('.nav-item[data-category]');
    catItems.forEach(item => {
      item.addEventListener('click', () => {
        catItems.forEach(c => c.classList.remove('active'));
        item.classList.add('active');
        state.category = item.dataset.category;
        renderDashboard();

        elements.sidebar.classList.remove('mobile-open');
      });
    });

    // Create Task Modal triggers
    elements.openTaskModalBtn.addEventListener('click', openCreateTaskModal);
    elements.topAddBtn.addEventListener('click', openCreateTaskModal);
    elements.emptyStateCreateBtn.addEventListener('click', openCreateTaskModal);
    elements.closeModalBtn.addEventListener('click', closeModal);
    elements.cancelModalBtn.addEventListener('click', closeModal);

    // Click outside modal dialog to dismiss
    elements.taskModalOverlay.addEventListener('click', (e) => {
      if (e.target === elements.taskModalOverlay) {
        closeModal();
      }
    });

    // Subtask add in modal
    elements.addSubtaskBtn.addEventListener('click', addSubtaskToModal);
    elements.newSubtaskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addSubtaskToModal();
      }
    });

    // Task Form Submit
    elements.taskForm.addEventListener('submit', handleFormSubmit);

    // Batch clear completed
    elements.clearCompletedBtn.addEventListener('click', clearCompletedTasks);

    // Mobile nav drawer toggle
    elements.mobileMenuBtn.addEventListener('click', () => {
      elements.sidebar.classList.toggle('mobile-open');
    });

    // Backup & Restore buttons
    elements.exportDataBtn.addEventListener('click', exportTasksJSON);
    elements.importDataTrigger.addEventListener('click', () => elements.importFileInput.click());
    elements.importFileInput.addEventListener('change', handleImportFile);
    elements.resetAllDataBtn.addEventListener('click', resetToDemoData);

    // Pomodoro Timer controls
    elements.startTimerBtn.addEventListener('click', toggleTimer);
    elements.resetTimerBtn.addEventListener('click', resetTimer);
    elements.skipTimerBtn.addEventListener('click', () => {
      switchTimerMode(currentTimerMode === 'focus' ? 'break' : 'focus');
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      if (e.key === 'Escape') {
        if (elements.taskModalOverlay.classList.contains('open')) {
          closeModal();
        }
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        elements.searchInput.focus();
      } else if ((e.key === 'n' || e.key === 'N') && !isInput && !elements.taskModalOverlay.classList.contains('open')) {
        e.preventDefault();
        openCreateTaskModal();
      }
    });

    // Setup Kanban columns
    setupKanbanDropzones();
  }

  /* ==========================================================================
     APP INITIALIZATION
     ========================================================================== */
  function init() {
    updateGreetingAndDate();
    loadTasksFromStorage();
    bindEvents();
    renderDashboard();
    updateTimerDisplay();

    // Auto-update date at midnight
    setInterval(updateGreetingAndDate, 60000);
  }

  // Start app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

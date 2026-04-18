import { useDraggableList } from './dragAndDrop';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { notifyAppDataChanged } from '../lib/dataEvents';
import { appendTrashTodo, appendArchiveTodo } from '../lib/trashArchive';
import SelectControl, { type SelectOption } from './SelectControl';

type Priority = 'high' | 'medium' | 'low';
type Category = 'work' | 'home' | 'growth' | 'health' | 'hobby' | 'other';

const PRIORITY_OPTIONS: SelectOption<Priority>[] = [
  { value: 'high', label: 'Высокий' },
  { value: 'medium', label: 'Средний' },
  { value: 'low', label: 'Низкий' },
];

const CATEGORY_OPTIONS: SelectOption<Category>[] = [
  { value: 'work', label: 'Работа/Учёба' },
  { value: 'home', label: 'Быт/Дом' },
  { value: 'growth', label: 'Личностный рост' },
  { value: 'health', label: 'Здоровье' },
  { value: 'hobby', label: 'Хобби' },
  { value: 'other', label: 'Другое' },
];

const FILTER_CATEGORY_OPTIONS: SelectOption<Category | 'all'>[] = [
  { value: 'all', label: 'Все' },
  ...CATEGORY_OPTIONS,
];

const FILTER_DEADLINE_OPTIONS: SelectOption<'all' | 'today' | 'overdue'>[] = [
  { value: 'all', label: 'Все' },
  { value: 'today', label: 'На сегодня' },
  { value: 'overdue', label: 'Просроченные' },
];

export interface Subtask {
  id: number;
  text: string;
  completed: boolean;
}

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  deadline?: string;
  subtasks?: Subtask[];
  note?: string;
}

const getInitialTodos = (): Todo[] => {
  try {
    const saved = localStorage.getItem('todos');
    return saved ? (JSON.parse(saved) as Todo[]) : [];
  } catch {
    return [];
  }
};

const persistTodos = (next: Todo[]) => {
  localStorage.setItem('todos', JSON.stringify(next));
  notifyAppDataChanged();
};

interface TodoListProps {
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

function deadlineClassFor(todo: Todo): string {
  if (!todo.deadline) return '';
  const now = new Date();
  const d = new Date(todo.deadline);
  if (!todo.completed && d < now) return 'overdue';
  if (!todo.completed && d.toDateString() === now.toDateString()) return 'today';
  return '';
}

interface TodoItemRowProps {
  todo: Todo;
  idx: number;
  editingNoteId: number | null;
  noteInput: string;
  setNoteInput: (v: string) => void;
  startEditNote: (id: number, note: string | undefined) => void;
  saveNote: (id: number) => void;
  cancelNoteEdit: () => void;
  toggleTodo: (id: number) => void;
  archiveTodo: (id: number) => void;
  moveTodoToTrash: (id: number) => void;
  addSubtask: (todoId: number, text: string) => void;
  toggleSubtask: (todoId: number, subtaskId: number) => void;
  removeSubtask: (todoId: number, subtaskId: number) => void;
  setSubtasks: (todoId: number, subtasks: Subtask[]) => void;
  handleDragStart: (i: number) => void;
  handleDragEnter: (i: number) => void;
  handleDragEnd: () => void;
}

const TodoItemRow: React.FC<TodoItemRowProps> = ({
  todo,
  idx,
  editingNoteId,
  noteInput,
  setNoteInput,
  startEditNote,
  saveNote,
  cancelNoteEdit,
  toggleTodo,
  archiveTodo,
  moveTodoToTrash,
  addSubtask,
  toggleSubtask,
  removeSubtask,
  setSubtasks,
  handleDragStart,
  handleDragEnter,
  handleDragEnd,
}) => {
  const [subtaskInput, setSubtaskInput] = useState('');
  const [dragSubFrom, setDragSubFrom] = useState<number | null>(null);

  const deadlineClass = deadlineClassFor(todo);

  const onSubtaskDragEnter = (stIdx: number) => {
    const list = todo.subtasks || [];
    if (dragSubFrom === null || dragSubFrom === stIdx) return;
    const next = [...list];
    const [removed] = next.splice(dragSubFrom, 1);
    next.splice(stIdx, 0, removed);
    setSubtasks(todo.id, next);
    setDragSubFrom(stIdx);
  };

  return (
    <li
      className={`todo-card ${todo.completed ? 'completed' : ''}`}
      draggable
      onDragStart={() => handleDragStart(idx)}
      onDragEnter={() => handleDragEnter(idx)}
      onDragEnd={handleDragEnd}
    >
      <div className="todo-card__top">
        <span
          className={`priority-dot ${todo.priority}`}
          title={
            todo.priority === 'high'
              ? 'Высокий приоритет'
              : todo.priority === 'medium'
                ? 'Средний приоритет'
                : 'Низкий приоритет'
          }
        />
        <span className={`category-dot ${todo.category}`} title={todo.category} />
        <span className="todo-card__title" onClick={() => toggleTodo(todo.id)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && toggleTodo(todo.id)}>
          {todo.text}
        </span>
        {todo.deadline && (
          <span
            className={`deadline-label ${deadlineClass}`}
            title={deadlineClass === 'overdue' ? 'Просрочено' : deadlineClass === 'today' ? 'На сегодня' : 'Дедлайн'}
          >
            {new Date(todo.deadline).toLocaleDateString()}
          </span>
        )}
        <div className="todo-card__actions-inline">
          <button type="button" className="btn-text btn-text--sm" onClick={() => archiveTodo(todo.id)}>
            Архив
          </button>
          <button type="button" className="icon-btn danger" onClick={() => moveTodoToTrash(todo.id)} aria-label="В корзину">
            ✕
          </button>
        </div>
      </div>

      <div className="note-block">
        {editingNoteId === todo.id ? (
          <div className="note-edit-row">
            <textarea
              className="note-edit"
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              rows={2}
              placeholder="Заметка/описание..."
            />
            <div className="note-edit-actions">
              <button type="button" className="note-save" onClick={() => saveNote(todo.id)}>
                Сохранить
              </button>
              <button type="button" className="note-cancel" onClick={cancelNoteEdit}>
                Отмена
              </button>
            </div>
          </div>
        ) : todo.note ? (
          <div className="note-view">
            <span>{todo.note}</span>
            <button type="button" className="note-edit-btn" onClick={() => startEditNote(todo.id, todo.note)} aria-label="Редактировать заметку">
              ✎
            </button>
          </div>
        ) : (
          <button type="button" className="note-add-btn" onClick={() => startEditNote(todo.id, todo.note)}>
            + Заметка
          </button>
        )}
      </div>

      <ul className="subtasks-list">
        {(todo.subtasks || []).map((st, stIdx) => (
          <li
            key={st.id}
            className={st.completed ? 'completed' : ''}
            draggable
            onDragStart={() => setDragSubFrom(stIdx)}
            onDragEnter={() => onSubtaskDragEnter(stIdx)}
            onDragEnd={() => setDragSubFrom(null)}
          >
            <span onClick={() => toggleSubtask(todo.id, st.id)} className="subtask-text">
              {st.text}
            </span>
            <button type="button" onClick={() => removeSubtask(todo.id, st.id)} className="subtask-remove" aria-label="Удалить подзадачу">
              ✕
            </button>
          </li>
        ))}
        <li className="subtask-input-row">
          <input
            type="text"
            className="subtask-input"
            value={subtaskInput}
            onChange={e => setSubtaskInput(e.target.value)}
            placeholder="Добавить подзадачу..."
            onKeyDown={e => {
              if (e.key === 'Enter') {
                addSubtask(todo.id, subtaskInput);
                setSubtaskInput('');
              }
            }}
          />
          <button
            type="button"
            className="subtask-add"
            onClick={() => {
              addSubtask(todo.id, subtaskInput);
              setSubtaskInput('');
            }}
            aria-label="Добавить подзадачу"
          >
            +
          </button>
        </li>
      </ul>
    </li>
  );
};

const TodoList: React.FC<TodoListProps> = ({ inputRef }) => {
  const [todos, setTodos] = useState<Todo[]>(getInitialTodos);
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>('other');
  const [deadline, setDeadline] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [filterDeadline, setFilterDeadline] = useState<'all' | 'today' | 'overdue'>('all');

  const [newTodoNote, setNewTodoNote] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  const [todoOrder, setTodoOrder] = useState<number[]>([]);

  const filteredTodos = useMemo(() => {
    let list = todos;
    if (filterCategory !== 'all') {
      list = list.filter(todo => todo.category === filterCategory);
    }
    if (filterDeadline === 'today') {
      const today = new Date().toISOString().slice(0, 10);
      list = list.filter(todo => todo.deadline && todo.deadline.slice(0, 10) === today);
    } else if (filterDeadline === 'overdue') {
      const now = new Date();
      list = list.filter(todo => todo.deadline && new Date(todo.deadline) < now && !todo.completed);
    }
    return list;
  }, [todos, filterCategory, filterDeadline]);

  useEffect(() => {
    const ids = filteredTodos.map(t => t.id);
    setTodoOrder(prev => {
      const kept = prev.filter(id => ids.includes(id));
      const missing = ids.filter(id => !kept.includes(id));
      if (kept.length === prev.length && missing.length === 0 && kept.length === ids.length) {
        return prev;
      }
      return [...kept, ...missing];
    });
  }, [filteredTodos]);

  const moveTodo = useCallback((from: number, to: number) => {
    setTodoOrder(prev => {
      const next = [...prev];
      const [removed] = next.splice(from, 1);
      next.splice(to, 0, removed);
      return next;
    });
  }, []);

  const { handleDragStart, handleDragEnter, handleDragEnd } = useDraggableList(todoOrder, moveTodo);

  const sortedTodos = useMemo(
    () => todoOrder.map(id => filteredTodos.find(t => t.id === id)).filter(Boolean) as Todo[],
    [todoOrder, filteredTodos]
  );

  const updateTodos = useCallback((updater: (prev: Todo[]) => Todo[]) => {
    setTodos(prev => {
      const next = updater(prev);
      persistTodos(next);
      return next;
    });
  }, []);

  const addTodo = () => {
    if (!input.trim()) return;
    updateTodos(prev => [
      ...prev,
      {
        id: Date.now(),
        text: input.trim(),
        completed: false,
        priority,
        category,
        deadline: deadline || undefined,
        subtasks: [],
        note: newTodoNote.trim() || undefined,
      },
    ]);
    setInput('');
    setPriority('medium');
    setCategory('other');
    setDeadline('');
    setNewTodoNote('');
  };

  const startEditNote = (id: number, note: string | undefined) => {
    setEditingNoteId(id);
    setNoteInput(note || '');
  };

  const saveNote = (id: number) => {
    updateTodos(prev =>
      prev.map(todo => (todo.id === id ? { ...todo, note: noteInput.trim() || undefined } : todo))
    );
    setEditingNoteId(null);
    setNoteInput('');
  };

  const cancelNoteEdit = () => {
    setEditingNoteId(null);
    setNoteInput('');
  };

  const addSubtask = (todoId: number, text: string) => {
    if (!text.trim()) return;
    updateTodos(prev =>
      prev.map(todo =>
        todo.id === todoId
          ? {
              ...todo,
              subtasks: [...(todo.subtasks || []), { id: Date.now(), text: text.trim(), completed: false }],
            }
          : todo
      )
    );
  };

  const toggleSubtask = (todoId: number, subtaskId: number) => {
    updateTodos(prev =>
      prev.map(todo =>
        todo.id === todoId
          ? {
              ...todo,
              subtasks: (todo.subtasks || []).map(st =>
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
              ),
            }
          : todo
      )
    );
  };

  const removeSubtask = (todoId: number, subtaskId: number) => {
    updateTodos(prev =>
      prev.map(todo =>
        todo.id === todoId
          ? { ...todo, subtasks: (todo.subtasks || []).filter(st => st.id !== subtaskId) }
          : todo
      )
    );
  };

  const setSubtasks = (todoId: number, subtasks: Subtask[]) => {
    updateTodos(prev => prev.map(todo => (todo.id === todoId ? { ...todo, subtasks } : todo)));
  };

  const toggleTodo = (id: number) => {
    updateTodos(prev => prev.map(todo => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)));
  };

  const archiveTodo = (id: number) => {
    updateTodos(prev => {
      const todo = prev.find(t => t.id === id);
      if (!todo) return prev;
      appendArchiveTodo(todo);
      return prev.filter(t => t.id !== id);
    });
  };

  const moveTodoToTrash = (id: number) => {
    updateTodos(prev => {
      const todo = prev.find(t => t.id === id);
      if (!todo) return prev;
      appendTrashTodo(todo);
      return prev.filter(t => t.id !== id);
    });
  };

  const todayMin = new Date().toISOString().slice(0, 10);

  return (
    <div className="todo-list">
      <div className="content-shell">
      <h2>ToDo-лист</h2>
      <div className="todo-input">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTodo()}
          placeholder="Новая задача..."
          aria-label="Текст новой задачи"
        />
        <SelectControl
          value={priority}
          onChange={setPriority}
          options={PRIORITY_OPTIONS}
          className="priority-select-wrap"
          ariaLabel="Приоритет"
        />
        <SelectControl
          value={category}
          onChange={setCategory}
          options={CATEGORY_OPTIONS}
          className="category-select-wrap"
          ariaLabel="Категория"
        />
        <input
          type="date"
          className="deadline-input"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          min={todayMin}
          title="Дедлайн"
          aria-label="Дедлайн"
        />
        <input
          type="text"
          className="note-input"
          value={newTodoNote}
          onChange={e => setNewTodoNote(e.target.value)}
          placeholder="Заметка при создании..."
          aria-label="Заметка к новой задаче"
        />
        <button type="button" onClick={addTodo}>
          Добавить
        </button>
      </div>
      <div className="todo-filters">
        <span>Категория:</span>
        <SelectControl
          value={filterCategory}
          onChange={setFilterCategory}
          options={FILTER_CATEGORY_OPTIONS}
          className="category-select-wrap"
          ariaLabel="Фильтр по категории"
        />
        <span>Дедлайн:</span>
        <SelectControl
          value={filterDeadline}
          onChange={setFilterDeadline}
          options={FILTER_DEADLINE_OPTIONS}
          className="deadline-select-wrap"
          ariaLabel="Фильтр по дедлайну"
        />
      </div>
      <ul className="todo-cards">
        {sortedTodos.map((todo, idx) => (
          <TodoItemRow
            key={todo.id}
            todo={todo}
            idx={idx}
            editingNoteId={editingNoteId}
            noteInput={noteInput}
            setNoteInput={setNoteInput}
            startEditNote={startEditNote}
            saveNote={saveNote}
            cancelNoteEdit={cancelNoteEdit}
            toggleTodo={toggleTodo}
            archiveTodo={archiveTodo}
            moveTodoToTrash={moveTodoToTrash}
            addSubtask={addSubtask}
            toggleSubtask={toggleSubtask}
            removeSubtask={removeSubtask}
            setSubtasks={setSubtasks}
            handleDragStart={handleDragStart}
            handleDragEnter={handleDragEnter}
            handleDragEnd={handleDragEnd}
          />
        ))}
      </ul>
      {sortedTodos.length === 0 && (
        <p className="empty-hint">
          Пока пусто: добавьте задачу в поле выше или смягчите фильтры — возможно, список просто отфильтрован.
        </p>
      )}
      </div>
    </div>
  );
};

export default TodoList;

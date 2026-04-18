import React from 'react';

const TODO_TEMPLATES = [
  'Купить продукты',
  'Позвонить врачу',
  'Подготовить отчёт',
  'Оплатить счета',
  'Написать письмо',
  'Сделать зарядку',
  'Прочитать главу книги',
];

const HABIT_TEMPLATES = [
  'Утренняя зарядка',
  'Выпить 8 стаканов воды',
  'Медитация 10 мин',
  'Чтение 30 мин',
  'Прогулка 30 мин',
  'Ложиться до 23:00',
  'Без соцсетей до обеда',
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (text: string) => void;
  type: 'todo' | 'habit';
}

const TemplatesModal: React.FC<Props> = ({ open, onClose, onSelect, type }) => {
  if (!open) return null;
  const list = type === 'todo' ? TODO_TEMPLATES : HABIT_TEMPLATES;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>{type === 'todo' ? 'Шаблоны задач' : 'Шаблоны привычек'}</h3>
        <ul className="templates-list">
          {list.map((t, i) => (
            <li key={i}>
              <button type="button" onClick={() => { onSelect(t); onClose(); }}>{t}</button>
            </li>
          ))}
        </ul>
        <button type="button" className="modal-close-btn" onClick={onClose}>Закрыть</button>
      </div>
    </div>
  );
};

export default TemplatesModal;

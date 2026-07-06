const DUE_SOON_DAYS = 3;

const urgencyOf = (dueDate) => {
  if (!dueDate) {
    return 'no_date';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due - today) / 86400000);

  if (diffDays < 0) {
    return 'overdue';
  }

  if (diffDays <= DUE_SOON_DAYS) {
    return 'due_soon';
  }

  return 'upcoming';
};

module.exports = { urgencyOf };

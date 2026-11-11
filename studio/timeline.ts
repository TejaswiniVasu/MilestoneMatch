import type { ColumnStore } from '@bryntum/grid-enterprise';
import { Gantt } from '@bryntum/gantt-enterprise';
import { StringHelper } from '@bryntum/core-enterprise';
import '@bryntum/core-enterprise/fontawesome/css/fontawesome.css';
import '@bryntum/core-enterprise/fontawesome/css/solid.css';
import '@bryntum/gantt-enterprise/gantt.css';
import '@bryntum/gantt-enterprise/svalbard-light.css';

declare const bryntum: { licenseKey?: string };
type Snapshot = {
  reviewId: string; startDate: Date; endDate: Date;
  resources: { id: string; name: string; amount: number; payment: string }[];
  events: { id: string; name: string; startDate: Date; endDate: Date; eventColor: string; readOnly: boolean }[];
  dependencies: { id: string; fromEvent: string; toEvent: string; type: number }[];
};
let registeredKey = '';
export function mountTimeline(element: HTMLElement, snapshot: Snapshot, onChange?: (message: string) => void, licenseKey = '') {
  if (licenseKey && licenseKey !== registeredKey) {
    bryntum.licenseKey = licenseKey;
    registeredKey = licenseKey;
  }
  const tasks = (next: Snapshot) => next.events.map(event => {
    const row = next.resources.find(row => row.id === event.id)!;
    return { id: event.id, name: row.name, startDate: event.startDate,
      duration: (event.endDate.getTime() - event.startDate.getTime()) / 86400000,
      durationUnit: 'day' as const, manuallyScheduled: true, readOnly: event.readOnly,
      eventColor: event.eventColor, amount: row.amount, payment: row.payment };
  });
  const dependencies = (next: Snapshot) => next.dependencies.map(link => ({
    id: link.id, fromTask: link.fromEvent, toTask: link.toEvent, type: link.type,
  }));
  const narrow = element.clientWidth < 650;
  const gantt = new Gantt({
    appendTo: element, height: 550, startDate: snapshot.startDate, endDate: snapshot.endDate,
    viewPreset: 'weekAndDayLetter', rowHeight: 76, barMargin: 14,
    project: { startDate: snapshot.startDate, tasks: tasks(snapshot), dependencies: dependencies(snapshot) },
    columns: [
      { id: 'milestone', type: 'name', text: 'Milestone', field: 'name', width: narrow ? 150 : 290, htmlEncode: true },
      { id: 'amount', text: 'USD', field: 'amount', width: 80, hidden: narrow, renderer: ({ value }: { value: unknown }) => Number(value).toFixed(2) },
      { id: 'payment', text: 'Payment', field: 'payment', width: 145, hidden: narrow, htmlEncode: true },
    ],
    features: { taskEdit: false, taskMenu: false, taskTooltip: false, cellEdit: false,
      dependencies: { allowCreate: false } },
    taskRenderer: ({ taskRecord }) => StringHelper.encodeHtml(String(taskRecord.get('payment'))),
    listeners: {
      taskDrop: () => onChange?.('Planned dates updated. Payment approvals and capture are unchanged.'),
      taskResizeEnd: () => onChange?.('Planned duration updated. Payment approvals and capture are unchanged.'),
    },
  });
  let compact = narrow;
  const resizeObserver = new ResizeObserver(() => {
    const nextCompact = element.clientWidth < 650;
    if (compact === nextCompact) return;
    compact = nextCompact;
    (gantt.columns as ColumnStore).getById('milestone').set({ width: compact ? 150 : 290 });
    (gantt.columns as ColumnStore).getById('amount').set({ hidden: compact });
    (gantt.columns as ColumnStore).getById('payment').set({ hidden: compact });
  });
  resizeObserver.observe(element);
  const fit = () => gantt.project.commitAsync().then(() => {
    if (!gantt.isDestroyed) return gantt.zoomToFit({ leftMargin: 15, rightMargin: 15, animate: false });
  });
  void fit();
  let reviewId = snapshot.reviewId;
  return {
    update(next: Snapshot, reset = false) {
      if (reset || next.reviewId !== reviewId) {
        gantt.startDate = next.startDate; gantt.endDate = next.endDate;
        gantt.taskStore.data = tasks(next);
        gantt.dependencyStore.data = dependencies(next);
        void fit();
      } else {
        gantt.suspendRefresh();
        for (const task of tasks(next)) gantt.taskStore.getById(task.id)?.set({ payment: task.payment, readOnly: task.readOnly, eventColor: task.eventColor });
        gantt.resumeRefresh(true);
      }
      reviewId = next.reviewId;
    },
    fit,
    destroy() { resizeObserver.disconnect(); gantt.destroy(); },
  };
}

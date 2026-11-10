import { Scheduler, StringHelper } from '@bryntum/scheduler';
import '@bryntum/scheduler/scheduler.css';
import '@bryntum/scheduler/stockholm-light.css';
import '@bryntum/scheduler/fontawesome/css/fontawesome.css';
import '@bryntum/scheduler/fontawesome/css/solid.css';

export function mountTimeline(element, snapshot, onChange) {
  const narrow = element.clientWidth < 650;
  const scheduler = new Scheduler({
    appendTo: element, height: 550, startDate: snapshot.startDate, endDate: snapshot.endDate,
    viewPreset: 'dayAndWeek', rowHeight: 76, barMargin: 14,
    resources: snapshot.resources, events: snapshot.events, dependencies: snapshot.dependencies,
    columns: [
      { text: 'Milestone', field: 'name', width: narrow ? 150 : 290, htmlEncode: true },
      { text: 'USD', field: 'amount', width: 80, hidden: narrow, renderer: ({ value }) => Number(value).toFixed(2) },
      { text: 'Payment', field: 'payment', width: 145, hidden: narrow, htmlEncode: true },
    ],
    features: {
      eventEdit: false, eventTooltip: false, eventMenu: false, scheduleMenu: false,
      cellEdit: false, eventDrag: { constrainDragToResource: true },
      dependencies: { allowCreate: false },
    },
    eventRenderer: ({ eventRecord }) => StringHelper.encodeHtml(eventRecord.name),
    listeners: {
      eventDrop: () => onChange?.('Planned dates updated. Payment approvals and capture are unchanged.'),
      eventResizeEnd: () => onChange?.('Planned duration updated. Payment approvals and capture are unchanged.'),
    },
  });
  const fit = () => scheduler.project.commitAsync().then(() => {
    if (!scheduler.isDestroyed) return scheduler.zoomToFit({ leftMargin: 15, rightMargin: 15, animate: false });
  });
  void fit();
  let reviewId = snapshot.reviewId;
  return {
    update(next, reset = false) {
      if (reset || next.reviewId !== reviewId) {
        scheduler.startDate = next.startDate; scheduler.endDate = next.endDate;
        scheduler.resourceStore.data = next.resources;
        scheduler.eventStore.data = next.events;
        scheduler.dependencyStore.data = next.dependencies;
        void fit();
      } else {
        scheduler.suspendRefresh();
        for (const row of next.resources) scheduler.resourceStore.getById(row.id)?.set({ payment: row.payment });
        for (const event of next.events) scheduler.eventStore.getById(event.id)?.set({ name: event.name, eventColor: event.eventColor, readOnly: event.readOnly });
        scheduler.resumeRefresh(true);
      }
      reviewId = next.reviewId;
    },
    fit,
    destroy() { scheduler.destroy(); },
  };
}

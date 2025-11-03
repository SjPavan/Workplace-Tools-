class MorningSummaryJob {
  constructor({ summaryService, schedulingService, nowProvider = () => new Date(), targetHour = 7 } = {}) {
    this.summaryService = summaryService;
    this.schedulingService = schedulingService;
    this.nowProvider = nowProvider;
    this.targetHour = targetHour;
    this.intervalHandle = null;
    this.lastRunDate = null;
  }

  run(date = this.nowProvider()) {
    const summary = this.summaryService.generateDailySummary(date);
    const plan = this.schedulingService.computeProactivePlan(date);
    this.lastRunDate = new Date(date);
    return {
      summary,
      reminders: plan.reminders,
      suggestions: plan.suggestions
    };
  }

  shouldRun(current) {
    if (!(current instanceof Date)) return false;
    const sameDayAsLastRun = this.lastRunDate && current.toDateString() === this.lastRunDate.toDateString();
    if (sameDayAsLastRun) return false;
    return current.getHours() >= this.targetHour;
  }

  start(intervalMs = 60 * 1000) {
    if (this.intervalHandle) return;
    this.intervalHandle = setInterval(() => {
      const now = this.nowProvider();
      if (this.shouldRun(now)) {
        this.run(now);
      }
    }, intervalMs);
  }

  stop() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }
}

module.exports = MorningSummaryJob;

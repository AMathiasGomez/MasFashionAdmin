const cron = require('node-cron');

const env = require('../config/env');
const reportService = require('../modules/reports/report.service');
const mailer = require('../utils/mailer');

const runScheduledReport = async () => {
  const { type, format, recipients } = env.scheduledReport;

  if (!recipients.length) {
    console.warn('[scheduled-report] Skipped: no REPORT_SCHEDULE_RECIPIENTS configured');
    return;
  }

  if (!mailer.isConfigured()) {
    console.warn('[scheduled-report] Skipped: SMTP is not configured');
    return;
  }

  try {
    const report = await reportService.exportReport(type, format, {});

    await mailer.sendReportEmail({
      to: recipients,
      subject: `Reporte automatico: ${type} (${new Date().toISOString().slice(0, 10)})`,
      text: 'Adjunto encontraras el reporte generado automaticamente por el panel administrativo.',
      attachment: {
        filename: report.filename,
        buffer: report.buffer,
        contentType: report.contentType
      }
    });

    console.log(`[scheduled-report] Sent "${type}" report to ${recipients.join(', ')}`);
  } catch (error) {
    console.error('[scheduled-report] Failed to send report:', error.message);
  }
};

const start = () => {
  if (!env.scheduledReport.enabled) {
    return;
  }

  if (!cron.validate(env.scheduledReport.cron)) {
    console.warn(`[scheduled-report] Invalid cron expression: ${env.scheduledReport.cron}`);
    return;
  }

  cron.schedule(env.scheduledReport.cron, runScheduledReport);
  console.log(`[scheduled-report] Scheduled "${env.scheduledReport.type}" report with cron "${env.scheduledReport.cron}"`);
};

module.exports = { start, runScheduledReport };

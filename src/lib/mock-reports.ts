/** @deprecated Use reports-store */
export {
  getAllReports,
  getOpenReportCount,
  resolveReport,
  setReportAdminNotes,
  submitReport,
  subscribeReports,
  type SubmitReportInput,
} from "@/lib/reports-store";
export type { Report } from "@/types/database";

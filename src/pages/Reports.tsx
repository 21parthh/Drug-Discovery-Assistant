import { DashboardLayout } from "@/components/DashboardLayout";
import { ReportHistory } from "@/components/ReportHistory";
const Reports = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Report History</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your previous drug discovery reports
          </p>
        </div>
        <ReportHistory />
      </div>
    </DashboardLayout>
  );
};
export default Reports;
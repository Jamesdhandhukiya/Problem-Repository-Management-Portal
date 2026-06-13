import { Button } from "@/components/ui/button";

export function DashboardCardExample() {
  return (
    <div className="w-full max-w-sm rounded-xl p-6 shadow-sm border border-gray-100 bg-card-white">
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-text-primary">
            Weekly Analytics
          </h3>
          <span className="inline-flex items-center rounded-full bg-accent-success/15 px-2.5 py-0.5 text-xs font-semibold text-accent-success">
            +12.5%
          </span>
        </div>
        
        <p className="text-sm text-text-secondary">
          Track your problem-solving progress and system engagement over the past 7 days.
        </p>
        
        <div className="pt-4">
          <Button className="w-full bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors shadow-md shadow-brand-primary/20">
            View Detailed Report
          </Button>
        </div>
      </div>
    </div>
  );
}

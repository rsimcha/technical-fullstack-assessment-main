import React from 'react';
import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';

const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">
          Property performance insights and metrics
        </p>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-white rounded-lg shadow border p-12 text-center">
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-primary-100 mb-6">
          <BarChart3 className="h-12 w-12 text-primary-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Analytics Dashboard Coming Soon
        </h3>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          We're working on comprehensive analytics to help you track property
          performance, occupancy rates, revenue trends, and more.
        </p>

        {/* Feature Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="text-sm font-medium text-gray-900">
              Revenue Tracking
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              Monitor rental income and trends
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mx-auto mb-3">
              <PieChart className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="text-sm font-medium text-gray-900">
              Occupancy Rates
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              Track unit availability and utilization
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mx-auto mb-3">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="text-sm font-medium text-gray-900">
              Performance Metrics
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              Comprehensive property insights
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;

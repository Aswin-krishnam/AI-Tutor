import React from 'react';
import "./ProgressChart.css";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const ProgressChart = ({ courseData, type = "line" }) => {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Prepare data for charts based on module completion status
  const prepareModuleData = () => {
    if (!courseData || !courseData.moduleData || !courseData.moduleData.length) {
      return [];
    }
    
    return courseData.moduleData
      .sort((a, b) => a.moduleIndex - b.moduleIndex)
      .map(module => ({
        name: `Module ${module.moduleIndex + 1}`,
        completed: module.completed ? 1 : 0,
        visits: module.visitCount || 0,
        lastAccessed: formatDate(module.lastAccessed)
      }));
  };

  // Custom tooltip component for the charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="pc__tooltip">
          <p className="pc__tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="pc__tooltip-data" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render line chart for showing completion and visits
  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={prepareModuleData()}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="completed"
          name="Completed"
          stroke="#4a6cf7"
          activeDot={{ r: 8 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="visits"
          name="Visits"
          stroke="#34c759"
        />
      </LineChart>
    </ResponsiveContainer>
  );

  // If no data is available
  if (!courseData || !courseData.moduleData || !courseData.moduleData.length) {
    return (
      <div className="pc__empty">
        <p>No progress data available. Start learning to see your progress!</p>
      </div>
    );
  }

  return (
    <div className="pc__container">
      {renderLineChart()}
    </div>
  );
};

export default ProgressChart;
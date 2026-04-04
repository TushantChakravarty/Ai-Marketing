import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { TrendDataPoint } from '../../types';
import { Colors, Spacing, Radius, Typography } from '../../theme';

interface EngagementChartProps {
  data: TrendDataPoint[];
  title?: string;
  color?: string;
  height?: number;
}

const screenWidth = Dimensions.get('window').width;

const EngagementChart: React.FC<EngagementChartProps> = ({
  data,
  title = 'Engagement',
  color = Colors.primary,
  height = 200,
}) => {
  if (data.length === 0) {
    return (
      <View style={[styles.container, styles.empty]}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const labels = data.map(d => {
    const date = new Date(d.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  const values = data.map(d => d.value);

  const chartData = {
    labels: labels.length > 7 ? labels.filter((_, i) => i % 2 === 0) : labels,
    datasets: [
      {
        data: values.length > 7 ? values.filter((_, i) => i % 2 === 0) : values,
        color: () => color,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: Colors.surface,
    backgroundGradientFrom: Colors.surface,
    backgroundGradientTo: Colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
    labelColor: () => Colors.textSecondary,
    style: { borderRadius: Radius.lg },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: color,
    },
    propsForBackgroundLines: {
      stroke: Colors.border,
      strokeDasharray: '4',
    },
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <LineChart
        data={chartData}
        width={screenWidth - Spacing.base * 4}
        height={height}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines
        withOuterLines={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  empty: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  chart: {
    borderRadius: Radius.md,
    marginLeft: -Spacing.sm,
  },
});

export default EngagementChart;

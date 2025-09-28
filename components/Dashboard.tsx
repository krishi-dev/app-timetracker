import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { ChevronLeft, ChevronRight, Calendar, BarChart3 } from 'lucide-react-native';
import {
  getCurrentDateString,
  addDays,
  formatDateForDisplay,
  getWeekDates,
  getMonthDates,
} from '@/utils/timeUtils';
import { getStatsForDateRange, getCategories } from '@/services/database';
import { Category } from '@/types/database';

const screenWidth = Dimensions.get('window').width;

type ViewMode = 'day' | 'week' | 'month';

interface DashboardData {
  categoryStats: { [categoryId: number]: { name: string; color: string; hours: number } };
  unloggedHours: number;
  totalHours: number;
}

export function Dashboard() {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentDate, setCurrentDate] = useState(getCurrentDateString());
  const [data, setData] = useState<DashboardData>({
    categoryStats: {},
    unloggedHours: 0,
    totalHours: 24,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentDate, viewMode]);

  const loadData = async () => {
    setLoading(true);
    try {
      const cats = await getCategories();
      setCategories(cats);

      let startDate = currentDate;
      let endDate = currentDate;
      let totalHoursForPeriod = 24;

      if (viewMode === 'week') {
        const weekDates = getWeekDates(currentDate);
        startDate = weekDates[0];
        endDate = weekDates[6];
        totalHoursForPeriod = 24 * 7;
      } else if (viewMode === 'month') {
        const monthDates = getMonthDates(currentDate);
        startDate = monthDates[0];
        endDate = monthDates[monthDates.length - 1];
        totalHoursForPeriod = 24 * monthDates.length;
      }

      const stats = await getStatsForDateRange(startDate, endDate);
      
      const categoryStats: { [categoryId: number]: { name: string; color: string; hours: number } } = {};
      let totalLoggedHours = 0;

      stats.forEach((stat: any) => {
        if (stat.category_id) {
          const categoryId = stat.category_id;
          if (!categoryStats[categoryId]) {
            categoryStats[categoryId] = {
              name: stat.category_name || 'Unknown',
              color: stat.category_color || '#6b7280',
              hours: 0,
            };
          }
          categoryStats[categoryId].hours += stat.hours;
          totalLoggedHours += stat.hours;
        }
      });

      const unloggedHours = Math.max(0, totalHoursForPeriod - totalLoggedHours);

      setData({
        categoryStats,
        unloggedHours,
        totalHours: totalHoursForPeriod,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    let days = 1;
    if (viewMode === 'week') days = 7;
    if (viewMode === 'month') days = 30;

    const newDate = addDays(currentDate, direction === 'next' ? days : -days);
    setCurrentDate(newDate);
  };

  const getPieChartData = () => {
    const chartData = [];
    
    Object.entries(data.categoryStats).forEach(([categoryId, stats]) => {
      if (stats.hours > 0) {
        chartData.push({
          name: stats.name,
          population: stats.hours,
          color: stats.color,
          legendFontColor: '#374151',
          legendFontSize: 12,
        });
      }
    });

    if (data.unloggedHours > 0) {
      chartData.push({
        name: 'Unlogged',
        population: data.unloggedHours,
        color: '#e5e7eb',
        legendFontColor: '#6b7280',
        legendFontSize: 12,
      });
    }

    return chartData;
  };

  const getBarChartData = () => {
    const labels = Object.values(data.categoryStats).map(stat => 
      stat.name.length > 8 ? stat.name.substring(0, 8) + '...' : stat.name
    );
    const dataPoints = Object.values(data.categoryStats).map(stat => stat.hours);

    return {
      labels,
      datasets: [{
        data: dataPoints.length > 0 ? dataPoints : [0],
      }],
    };
  };

  const getDateRangeText = () => {
    if (viewMode === 'day') {
      return formatDateForDisplay(currentDate);
    } else if (viewMode === 'week') {
      const weekDates = getWeekDates(currentDate);
      return `${formatDateForDisplay(weekDates[0])} - ${formatDateForDisplay(weekDates[6])}`;
    } else {
      const date = new Date(currentDate);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const pieChartData = getPieChartData();
  const barChartData = getBarChartData();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Dashboard</Text>
        
        <View style={styles.viewModeButtons}>
          {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.viewModeButton,
                viewMode === mode && styles.activeViewModeButton
              ]}
              onPress={() => setViewMode(mode)}
            >
              <Text style={[
                styles.viewModeButtonText,
                viewMode === mode && styles.activeViewModeButtonText
              ]}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.dateNavigation}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigateDate('prev')}>
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        
        <Text style={styles.dateText}>{getDateRangeText()}</Text>
        
        <TouchableOpacity style={styles.navButton} onPress={() => navigateDate('next')}>
          <ChevronRight size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Time Distribution</Text>
          
          {pieChartData.length > 0 ? (
            <View style={styles.chartContainer}>
              <PieChart
                data={pieChartData}
                width={screenWidth - 32}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Calendar size={48} color="#9ca3af" />
              <Text style={styles.emptyChartText}>No time logged for this period</Text>
            </View>
          )}
        </View>

        {Object.keys(data.categoryStats).length > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Hours by Category</Text>
            <View style={styles.chartContainer}>
              <BarChart
                data={barChartData}
                width={screenWidth - 32}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
                  strokeWidth: 2,
                  barPercentage: 0.7,
                }}
                style={styles.chart}
                yAxisSuffix="h"
                showValuesOnTopOfBars
              />
            </View>
          </View>
        )}

        <View style={styles.summaryContainer}>
          <Text style={styles.sectionTitle}>Summary</Text>
          
          {Object.entries(data.categoryStats).map(([categoryId, stats]) => (
            <View key={categoryId} style={styles.summaryItem}>
              <View style={styles.summaryLeft}>
                <View style={[styles.colorDot, { backgroundColor: stats.color }]} />
                <Text style={styles.summaryLabel}>{stats.name}</Text>
              </View>
              <Text style={styles.summaryValue}>{stats.hours.toFixed(1)}h</Text>
            </View>
          ))}
          
          {data.unloggedHours > 0 && (
            <View style={styles.summaryItem}>
              <View style={styles.summaryLeft}>
                <View style={[styles.colorDot, { backgroundColor: '#e5e7eb' }]} />
                <Text style={styles.summaryLabel}>Unlogged</Text>
              </View>
              <Text style={styles.summaryValue}>{data.unloggedHours.toFixed(1)}h</Text>
            </View>
          )}
          
          <View style={[styles.summaryItem, styles.totalItem]}>
            <Text style={styles.totalLabel}>Total Period</Text>
            <Text style={styles.totalValue}>{data.totalHours}h</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  viewModeButtons: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    padding: 2,
  },
  viewModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  activeViewModeButton: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewModeButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  activeViewModeButtonText: {
    color: '#374151',
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  navButton: {
    padding: 8,
    borderRadius: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 8,
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyChartText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  totalItem: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },
});
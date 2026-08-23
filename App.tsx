import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SelectedEnrollmentProvider } from './src/features/enrollment/SelectedEnrollmentContext';
import { colors } from './src/theme';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import StudentHomeScreen from './src/screens/StudentHomeScreen';
import MyLearningScreen from './src/screens/MyLearningScreen';
import StudentSlotsScreen from './src/screens/StudentSlotsScreen';
import StudentGradesScreen from './src/screens/StudentGradesScreen';
import StudentAttendanceScreen from './src/screens/StudentAttendanceScreen';
import TeacherHomeScreen from './src/screens/TeacherHomeScreen';
import TeacherDashboardScreen from './src/screens/TeacherDashboardScreen';
import TeacherAttendanceScreen from './src/screens/TeacherAttendanceScreen';
import AdminHomeScreen from './src/screens/AdminHomeScreen';
import AdminVolunteersScreen from './src/screens/AdminVolunteersScreen';
import AdminVolunteerAnalyticsScreen from './src/screens/AdminVolunteerAnalyticsScreen';
import AdminEnrollmentsScreen from './src/screens/AdminEnrollmentsScreen';
import AdminSyllabusScreen from './src/screens/AdminSyllabusScreen';
import AdminTeacherAvailabilityScreen from './src/screens/AdminTeacherAvailabilityScreen';
import AdminBulkBookingScreen from './src/screens/AdminBulkBookingScreen';
import AdminTeachersDashboardScreen from './src/screens/AdminTeachersDashboardScreen';
import AdminAttendanceConfigScreen from './src/screens/AdminAttendanceConfigScreen';
import AdminReportsScreen from './src/screens/AdminReportsScreen';
import AdminGroupDetailScreen from './src/screens/AdminGroupDetailScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  // Role-based navigation
  if (user.role === 'ADMIN') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
        <Stack.Screen name="AdminSyllabus" component={AdminSyllabusScreen} />
        <Stack.Screen name="AdminTeacherAvailability" component={AdminTeacherAvailabilityScreen} />
        <Stack.Screen name="AdminBulkBooking" component={AdminBulkBookingScreen} />
        <Stack.Screen name="AdminTeachersDashboard" component={AdminTeachersDashboardScreen} />
        <Stack.Screen name="AdminEnrollments" component={AdminEnrollmentsScreen} />
        <Stack.Screen name="AdminVolunteers" component={AdminVolunteersScreen} />
        <Stack.Screen name="AdminVolunteerAnalytics" component={AdminVolunteerAnalyticsScreen} />
        <Stack.Screen name="AdminAttendanceConfig" component={AdminAttendanceConfigScreen} />
        <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
        <Stack.Screen name="AdminGroupDetail" component={AdminGroupDetailScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      </Stack.Navigator>
    );
  }

  if (user.role === 'TEACHER') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TeacherHome" component={TeacherHomeScreen} />
        <Stack.Screen name="TeacherDashboard" component={TeacherDashboardScreen} />
        <Stack.Screen name="TeacherAttendance" component={TeacherAttendanceScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      </Stack.Navigator>
    );
  }

  if (user.role === 'STUDENT') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MyLearning" component={MyLearningScreen} />
        <Stack.Screen name="StudentDashboard" component={StudentHomeScreen} />
        <Stack.Screen name="StudentSlots" component={StudentSlotsScreen} />
        <Stack.Screen name="StudentGrades" component={StudentGradesScreen} />
        <Stack.Screen name="StudentAttendance" component={StudentAttendanceScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <View style={styles.unsupportedRole}>
      <Text style={styles.unsupportedRoleTitle}>Unsupported account role</Text>
      <Text style={styles.unsupportedRoleText}>This account cannot access the mobile application.</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Return to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  unsupportedRole: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.bg,
  },
  unsupportedRoleTitle: {
    color: colors.textDark,
    fontSize: 20,
    fontWeight: '700',
  },
  unsupportedRoleText: {
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  logoutButton: {
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.navy,
  },
  logoutButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default function App() {
  return (
    <AuthProvider>
      <SelectedEnrollmentProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </SelectedEnrollmentProvider>
    </AuthProvider>
  );
}

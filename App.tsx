import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SelectedEnrollmentProvider } from './src/features/enrollment/SelectedEnrollmentContext';
import ProfileCompletionGate from './src/features/account/ProfileCompletionGate';
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
import TeacherAvailabilityScreen from './src/screens/TeacherAvailabilityScreen';
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
import AccountSettingsScreen from './src/screens/AccountSettingsScreen';
import StudentNewEnrollmentScreen from './src/screens/StudentNewEnrollmentScreen';
import type {
  AdminStackParamList,
  AuthenticationStackParamList,
  StudentStackParamList,
  TeacherStackParamList,
} from './src/navigation/types';

const AuthStack = createNativeStackNavigator<AuthenticationStackParamList>();
const StudentStack = createNativeStackNavigator<StudentStackParamList>();
const TeacherStack = createNativeStackNavigator<TeacherStackParamList>();
const AdminStack = createNativeStackNavigator<AdminStackParamList>();

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
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
      </AuthStack.Navigator>
    );
  }

  // Role-based navigation
  if (user.role === 'ADMIN') {
    return (
      <AdminStack.Navigator screenOptions={{ headerShown: false }}>
        <AdminStack.Screen name="AdminHome" component={AdminHomeScreen} />
        <AdminStack.Screen name="AdminSyllabus" component={AdminSyllabusScreen} />
        <AdminStack.Screen name="AdminTeacherAvailability" component={AdminTeacherAvailabilityScreen} />
        <AdminStack.Screen name="AdminBulkBooking" component={AdminBulkBookingScreen} />
        <AdminStack.Screen name="AdminTeachersDashboard" component={AdminTeachersDashboardScreen} />
        <AdminStack.Screen name="AdminEnrollments" component={AdminEnrollmentsScreen} />
        <AdminStack.Screen name="AdminVolunteers" component={AdminVolunteersScreen} />
        <AdminStack.Screen name="AdminVolunteerAnalytics" component={AdminVolunteerAnalyticsScreen} />
        <AdminStack.Screen name="AdminAttendanceConfig" component={AdminAttendanceConfigScreen} />
        <AdminStack.Screen name="AdminReports" component={AdminReportsScreen} />
        <AdminStack.Screen name="AdminGroupDetail" component={AdminGroupDetailScreen} />
        <AdminStack.Screen name="AccountSettings" component={AccountSettingsScreen} />
        <AdminStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      </AdminStack.Navigator>
    );
  }

  if (user.role === 'TEACHER') {
    return (
      <TeacherStack.Navigator screenOptions={{ headerShown: false }}>
        <TeacherStack.Screen name="TeacherHome" component={TeacherHomeScreen} />
        <TeacherStack.Screen name="TeacherAvailability" component={TeacherAvailabilityScreen} />
        <TeacherStack.Screen name="TeacherDashboard" component={TeacherDashboardScreen} />
        <TeacherStack.Screen name="TeacherAttendance" component={TeacherAttendanceScreen} />
        <TeacherStack.Screen name="AccountSettings" component={AccountSettingsScreen} />
        <TeacherStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      </TeacherStack.Navigator>
    );
  }

  if (user.role === 'STUDENT') {
    return (
      <StudentStack.Navigator screenOptions={{ headerShown: false }}>
        <StudentStack.Screen name="MyLearning" component={MyLearningScreen} />
        <StudentStack.Screen name="StudentNewEnrollment" component={StudentNewEnrollmentScreen} />
        <StudentStack.Screen name="StudentDashboard" component={StudentHomeScreen} />
        <StudentStack.Screen name="StudentSlots" component={StudentSlotsScreen} />
        <StudentStack.Screen name="StudentGrades" component={StudentGradesScreen} />
        <StudentStack.Screen name="StudentAttendance" component={StudentAttendanceScreen} />
        <StudentStack.Screen name="AccountSettings" component={AccountSettingsScreen} />
        <StudentStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      </StudentStack.Navigator>
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
        <ProfileCompletionGate>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </ProfileCompletionGate>
      </SelectedEnrollmentProvider>
    </AuthProvider>
  );
}

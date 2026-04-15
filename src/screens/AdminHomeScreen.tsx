import React from 'react';
import { ScrollView, View, Text, StyleSheet, ImageBackground } from 'react-native';
import { TopNavbar, ActionGrid, Footer } from '../components';
import { colors, fonts, borderRadius } from '../theme';
import { useAuth } from '../context/AuthContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const bgAdmin = require('../../assets/bg_admin.png');

type Props = { navigation: NativeStackNavigationProp<any> };

export default function AdminHomeScreen({ navigation }: Props) {
  const { user, logout } = useAuth();

  const actions = [
    {
      title: 'Syllabus',
      description: 'Configure chapters & sloka ranges',
      iconLabel: '📖',
      iconBg: colors.primary,
      iconColor: '#fff',
      onPress: () => navigation.navigate('AdminSyllabus'),
    },
    {
      title: 'Teacher Availability',
      description: 'View & manage teacher schedules',
      iconLabel: '📅',
      iconBg: colors.navy,
      iconColor: '#fff',
      onPress: () => navigation.navigate('AdminTeacherAvailability'),
    },
    {
      title: 'Student Slot Booking',
      description: 'Bulk book student exam slots',
      iconLabel: '👥',
      iconBg: colors.primaryDark,
      iconColor: '#fff',
      onPress: () => navigation.navigate('AdminBulkBooking'),
    },
    {
      title: 'Teachers Dashboard',
      description: "View all teachers' performance",
      iconLabel: '📊',
      iconBg: colors.navyLight,
      iconColor: '#fff',
      onPress: () => navigation.navigate('AdminTeachersDashboard'),
    },
    {
      title: 'New Enrollments',
      description: 'Review student enrollment requests',
      iconLabel: '🙋',
      iconBg: colors.teal,
      iconColor: '#fff',
      onPress: () => navigation.navigate('AdminEnrollments'),
    },
    {
      title: 'Manage Volunteers',
      description: 'Drop / Reactivate volunteers',
      iconLabel: '⚙️',
      iconBg: colors.maroon,
      iconColor: '#fff',
      onPress: () => navigation.navigate('AdminVolunteers'),
    },
    {
      title: 'Attendance Config',
      description: 'Configure group attendance settings',
      iconLabel: '✅',
      iconBg: colors.gold,
      iconColor: '#fff',
      onPress: () => navigation.navigate('AdminAttendanceConfig'),
    },
  ];

  return (
    <ImageBackground source={bgAdmin} style={styles.page} resizeMode="cover" imageStyle={styles.bgImage}>
      <View style={styles.overlay}>
        <TopNavbar
          title="SDHS BG Admin"
          actions={[
            { label: 'Switch User', onPress: logout },
            { label: 'Logout', onPress: logout, variant: 'logout' },
          ]}
        />
        <ScrollView contentContainerStyle={styles.content}>
          {/* Hero Section - matching admin_home.jsp page-hero */}
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Admin Console</Text>
            <Text style={styles.heroSubtitle}>
              Welcome, <Text style={styles.heroBold}>{user?.name}</Text>
            </Text>
            <View style={styles.heroDivider} />
          </View>

          <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
          <ActionGrid actions={actions} columns={4} />

          <Footer />
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, width: '100%', height: '100%' },
  bgImage: { width: '100%', height: '100%' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  content: { padding: 16, gap: 16 },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xxl,
    padding: 36,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: colors.gold,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    ...fonts.extraBold,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    marginTop: 8,
    ...fonts.regular,
  },
  heroBold: {
    ...fonts.bold,
    color: '#fff',
  },
  heroDivider: {
    width: 60,
    height: 3,
    backgroundColor: colors.gold,
    borderRadius: 2,
    marginTop: 14,
  },
  sectionLabel: {
    fontSize: 12,
    ...fonts.bold,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.5)',
    paddingLeft: 4,
  },
});

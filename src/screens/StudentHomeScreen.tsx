import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { TopNavbar, WelcomeCard, ActionGrid, Footer } from '../components';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function StudentHomeScreen({ navigation }: Props) {
  const { user, logout } = useAuth();

  const badges = [
    { label: user?.volunteerId || '' },
    ...(user?.groupId ? [{ label: `Group ${user.groupId}` }] : []),
  ];

  const actions = [
    {
      title: 'Book Slot',
      description: 'Book your exam slot',
      iconLabel: '📅',
      iconBg: colors.blueBg,
      iconColor: colors.blue,
      onPress: () => navigation.navigate('StudentSlots'),
    },
    {
      title: 'Exam History',
      description: 'See your test results',
      iconLabel: '🏆',
      iconBg: colors.greenBg,
      iconColor: colors.green,
      onPress: () => navigation.navigate('StudentGrades'),
    },
    {
      title: 'Attendance',
      description: 'Check your attendance',
      iconLabel: '📋',
      iconBg: colors.orangeBg,
      iconColor: colors.primary,
      onPress: () => navigation.navigate('StudentAttendance'),
    },
    {
      title: 'Analytics',
      description: 'Your stats overview',
      iconLabel: '📈',
      iconBg: colors.purpleBg,
      iconColor: colors.purple,
      disabled: true,
    },
  ];

  return (
    <View style={styles.page}>
      <TopNavbar
        title="Student Dashboard"
        actions={[
          { label: 'Password', onPress: () => navigation.navigate('ChangePassword') },
          { label: 'Logout', onPress: logout, variant: 'logout' },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <WelcomeCard greeting="Welcome back" name={user?.name || ''} badges={badges} />
        <ActionGrid actions={actions} columns={4} />
        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 16 },
});

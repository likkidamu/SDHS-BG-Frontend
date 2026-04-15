import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { TopNavbar, WelcomeCard, ActionGrid, Footer } from '../components';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function TeacherHomeScreen({ navigation }: Props) {
  const { user, logout } = useAuth();

  const badges = [{ label: user?.volunteerId || '' }];

  const actions = [
    {
      title: 'Exam Grading',
      description: 'Grade assigned students',
      iconLabel: '✏️',
      iconBg: colors.blueBg,
      iconColor: colors.blue,
      onPress: () => navigation.navigate('TeacherDashboard'),
    },
    {
      title: 'Attendance',
      description: 'Mark student attendance',
      iconLabel: '📋',
      iconBg: colors.greenBg,
      iconColor: colors.green,
      onPress: () => navigation.navigate('TeacherAttendance'),
    },
    {
      title: 'Your Analytics',
      description: 'Stats shown below',
      iconLabel: '📈',
      iconBg: colors.purpleBg,
      iconColor: colors.purple,
      disabled: true,
    },
  ];

  return (
    <View style={styles.page}>
      <TopNavbar
        title="Teacher Dashboard"
        actions={[
          { label: 'Password', onPress: () => navigation.navigate('ChangePassword') },
          { label: 'Logout', onPress: logout, variant: 'logout' },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <WelcomeCard greeting="Welcome back" name={user?.name || ''} badges={badges} />
        <ActionGrid actions={actions} columns={3} />
        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 16 },
});

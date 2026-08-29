import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthenticationStackParamList = {
  Login: undefined;
};

export interface MyLearningParams {
  enrollmentRequestSuccess?: boolean;
}

export interface AdminVolunteerAnalyticsParams {
  vid: string;
}

export interface AdminGroupDetailParams {
  groupId: string;
  groupName: string | null;
}

export type SharedStackParamList = {
  AccountSettings: undefined;
  ChangePassword: undefined;
};

export type StudentStackParamList = SharedStackParamList & {
  MyLearning: MyLearningParams | undefined;
  StudentNewEnrollment: undefined;
  StudentDashboard: undefined;
  StudentSlots: undefined;
  StudentGrades: undefined;
  StudentAttendance: undefined;
};

export type TeacherStackParamList = SharedStackParamList & {
  TeacherHome: undefined;
  TeacherAvailability: undefined;
  TeacherDashboard: undefined;
  TeacherAttendance: undefined;
};

export type AdminStackParamList = SharedStackParamList & {
  AdminHome: undefined;
  AdminSyllabus: undefined;
  AdminTeacherAvailability: undefined;
  AdminBulkBooking: undefined;
  AdminTeachersDashboard: undefined;
  AdminEnrollments: undefined;
  AdminVolunteers: undefined;
  AdminVolunteerAnalytics: AdminVolunteerAnalyticsParams;
  AdminAttendanceConfig: undefined;
  AdminReports: undefined;
  AdminGroupDetail: AdminGroupDetailParams;
};

export type StudentScreenProps<RouteName extends keyof StudentStackParamList> =
  NativeStackScreenProps<StudentStackParamList, RouteName>;

export type TeacherScreenProps<RouteName extends keyof TeacherStackParamList> =
  NativeStackScreenProps<TeacherStackParamList, RouteName>;

export type AdminScreenProps<RouteName extends keyof AdminStackParamList> =
  NativeStackScreenProps<AdminStackParamList, RouteName>;

export type SharedScreenProps<RouteName extends keyof SharedStackParamList> =
  | NativeStackScreenProps<StudentStackParamList, RouteName>
  | NativeStackScreenProps<TeacherStackParamList, RouteName>
  | NativeStackScreenProps<AdminStackParamList, RouteName>;

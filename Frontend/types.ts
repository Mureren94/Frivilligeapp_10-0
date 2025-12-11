import React from 'react';
import type { PermissionId } from './permissions';

export interface Task {
  id: string; title: string; image?: string; description: string; task_date: string;
  category: string; points: number; volunteers_needed: number; is_completed: boolean;
  repeat_frequency?: number; repeat_interval?: 'dage' | 'uger' | 'måneder';
  original_task_id?: string; is_template?: boolean; created_by?: string; estimated_time?: number;
}

export interface User {
  id: string; name: string; email: string; password?: string; role: string; points: number;
  image?: string; phone?: string; phone_is_public?: boolean;
  notification_preferences?: { new_task: boolean; shift_trade_completed: boolean; newsletter: boolean; };
}

export interface Profile {
  id: string; name: string; email: string; image?: string; points: number; role: string;
  phone?: string; phone_is_public?: boolean; password?: string;
  notification_preferences?: { new_task: boolean; shift_trade_completed: boolean; newsletter: boolean; };
}

export interface Role { id: string; name: string; permissions: PermissionId[]; is_default?: boolean; }
export interface Shift { id: string; date: string; startTime?: string; endTime?: string; title?: string; description?: string; }
export interface ShiftRole { id: string; shiftId: string; userId: string | null; roleName: string; }
export interface ShiftTrade { id: string; shiftRoleId: string; offeringUserId: string; acceptingUserId: string | null; status: 'PENDING' | 'COMPLETED' | 'CANCELLED'; createdAt: string; }
export interface GalleryImage { id: string; data: string; name: string; uploadDate: string; size: number; width: number; height: number; uploadedBy: string; tags?: string[]; }

export type Page = 'Dashboard' | 'Opgaveliste' | 'Vagtplan' | 'Min Profil' | 'Leaderboard' | 'Admin';
export interface PasswordResetToken { token: string; email: string; expires: number; }
export type NotificationType = 'new_task' | 'shift_trade_completed' | 'newsletter';
export type EmailTemplateType = 'password_reset' | NotificationType;

export interface AppSettings {
  siteName: string; siteIcon: string; siteNameColor: string; defaultTaskImage?: string;
  pointGoal?: number; enablePoints?: boolean; minTaskPoints?: number; maxTaskPoints?: number;
  menuVisibility?: { opgaveliste: boolean; vagtplan: boolean; leaderboard: boolean; };
  smtp: { host: string; port: string; user: string; pass: string; senderEmail: string; };
  notification_role_defaults?: { new_task: string[]; shift_trade_completed: string[]; newsletter: string[]; };
  email_templates?: {
    password_reset: { subject: string; body: string; deliveryMethod: 'to' | 'cc' | 'bcc'; };
    new_task: { subject: string; body: string; deliveryMethod: 'to' | 'cc' | 'bcc'; };
    shift_trade_completed: { subject: string; body: string; deliveryMethod: 'to' | 'cc' | 'bcc'; };
    newsletter: { subject: string; body: string; deliveryMethod: 'to' | 'cc' | 'bcc'; };
  };
}

export interface AdminNotification {
  id: string; type: 'ShiftLeft'; message: string; timestamp: string; read: boolean;
  details: { userName: string; shiftTitle: string; shiftDate: string; }
}

export interface IDataContext {
  tasks: Task[]; categories: string[]; shiftRoleTypes: string[]; users: User[]; roles: Role[];
  shifts: Shift[]; shiftRoles: ShiftRole[]; shiftTrades: ShiftTrade[]; settings: AppSettings;
  currentUser: User | null; userTaskSignups: { [email: string]: string[] };
  passwordResetTokens: PasswordResetToken[]; signedUpTaskIds: string[]; theme: 'light' | 'dark';
  adminNotifications: AdminNotification[]; galleryImages: GalleryImage[];

  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  setShiftRoleTypes: React.Dispatch<React.SetStateAction<string[]>>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  setShiftRoles: React.Dispatch<React.SetStateAction<ShiftRole[]>>;
  setShiftTrades: React.Dispatch<React.SetStateAction<ShiftTrade[]>>;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  setPasswordResetTokens: React.Dispatch<React.SetStateAction<PasswordResetToken[]>>;
  setAdminNotifications: React.Dispatch<React.SetStateAction<AdminNotification[]>>;
  setGalleryImages: React.Dispatch<React.SetStateAction<GalleryImage[]>>;

  handleLogin: (email: string, password: string, remember?: boolean) => Promise<boolean>;
  handleLogout: (callback: () => void) => Promise<void>;
  handleSignUp: (taskId: string) => Promise<void>;
  handleCreateTask: (newTask: Omit<Task, 'id' | 'created_by' | 'is_completed'>) => Promise<void>;
  handleUnregister: (taskId: string) => Promise<void>;
  handleProfileSave: (profileUpdate: Partial<Profile>) => Promise<void>;

  handlePasswordReset: (email: string, newPassword: string) => boolean;
  handleForgotPasswordRequest: (email: string) => 'success';
  toggleTheme: () => void;
  userHasPermission: (permission: PermissionId) => boolean;
  sendEmailNotification: (type: NotificationType, options: any) => void;

  handleTakeShiftRole: (shiftRoleId: string) => Promise<void>;
  handleLeaveShiftRole: (shiftRoleId: string) => Promise<void>;
  handleInitiateShiftTrade: (shiftRoleId: string) => void;
  handleAcceptShiftTrade: (tradeId: string) => void;
  handleCancelShiftTrade: (tradeId: string) => void;

  handleSaveSettings: (newSettings: AppSettings) => Promise<void>;
  handleAddCategory: (name: string) => Promise<void>;
  handleDeleteCategory: (name: string) => Promise<void>;
  handleSaveRole: (role: Role) => Promise<void>;
  handleDeleteRole: (roleId: string) => Promise<void>;
  handleSaveUser: (user: User) => Promise<boolean>;
  handleDeleteUser: (userId: string) => Promise<void>;
  handleMarkNotificationsAsRead: () => Promise<void>;
}
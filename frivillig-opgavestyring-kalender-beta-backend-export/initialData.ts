




import type { User, Task, AppSettings, Role, Shift, ShiftRole } from './types';

export const initialRoles: Role[] = [
    {
        id: 'superadmin',
        name: 'Super Admin',
        is_default: true,
        permissions: ['access_admin_panel', 'manage_tasks', 'manage_users', 'manage_categories', 'manage_settings', 'manage_roles', 'manage_shifts', 'manage_gallery']
    },
    {
        id: 'admin',
        name: 'Admin',
        is_default: true,
        permissions: ['access_admin_panel', 'manage_tasks', 'manage_users', 'manage_categories', 'manage_shifts', 'manage_gallery']
    },
    {
        id: 'bruger',
        name: 'Bruger',
        is_default: true,
        permissions: []
    }
];

export const initialUsers: User[] = [
    {
        id: '1',
        name: 'Super Admin',
        email: 'superadmin@test.dk',
        password: 'superadmin',
        role: 'superadmin',
        points: 150,
        image: 'https://picsum.photos/seed/1/200',
        phone: '11223344',
        phone_is_public: true,
        notification_preferences: { new_task: true, shift_trade_completed: true, newsletter: true }
    },
    {
        id: '2',
        name: 'Almindelig Admin',
        email: 'admin@test.dk',
        password: 'admin',
        role: 'admin',
        points: 75,
        image: 'https://picsum.photos/seed/2/200',
        phone: '22334455',
        phone_is_public: false,
        notification_preferences: { new_task: true, shift_trade_completed: true, newsletter: true }
    },
    {
        id: '3',
        name: 'Bettina Bruger',
        email: 'bruger@test.dk',
        password: 'bruger',
        role: 'bruger',
        points: 120,
        image: 'https://picsum.photos/seed/3/200',
        phone: '33445566',
        phone_is_public: true,
        notification_preferences: { new_task: true, shift_trade_completed: true, newsletter: false }
    },
     {
        id: '4',
        name: 'Brian Biceps',
        email: 'brian@test.dk',
        password: 'brian',
        role: 'bruger',
        points: 210,
        image: 'https://picsum.photos/seed/4/200',
        phone: '44556677',
        phone_is_public: false,
        notification_preferences: { new_task: true, shift_trade_completed: true, newsletter: true }
    }
];

export const initialTasks: Task[] = [
    {
        id: 't1',
        title: 'Opstilling af Boder',
        description: 'Hjælp med at stille boder op til sommerfesten. Kræver lidt muskler og godt humør.',
        task_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Praktisk',
        points: 20,
        volunteers_needed: 4,
        is_completed: false,
        image: 'https://picsum.photos/seed/task1/400/200',
        estimated_time: 180,
    },
    {
        id: 't2',
        title: 'Salg af Kage i Tombola',
        description: 'Stå i tombolaen og sælg kager. Du skal være smilende og god til hovedregning.',
        task_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Salg',
        points: 15,
        volunteers_needed: 2,
        is_completed: false,
        estimated_time: 120,
    },
    {
        id: 't3',
        title: 'Uddeling af Flyers',
        description: 'Gå en tur i lokalområdet og del flyers ud for vores næste arrangement.',
        task_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Marketing',
        points: 10,
        volunteers_needed: 5,
        is_completed: true,
        estimated_time: 90,
    },
    {
        id: 't4',
        title: 'Oprydning efter Fest',
        description: 'Den sure tjans! Hjælp med at rydde op, tørre borde af og feje gulvet.',
        task_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Praktisk',
        points: 30,
        volunteers_needed: 1,
        is_completed: false,
        estimated_time: 240,
    }
];

export const initialCategories: string[] = ['Praktisk', 'Salg', 'Marketing', 'Koordination'];

export const initialSettings: AppSettings = {
  siteName: 'FrivilligPortalen',
  siteIcon: '',
  siteNameColor: '#059669', // Corresponds to emerald-600
  defaultTaskImage: '',
  pointGoal: 250,
  enablePoints: true,
  minTaskPoints: 1,
  maxTaskPoints: 1000,
  menuVisibility: {
    opgaveliste: true,
    vagtplan: true,
    leaderboard: true,
  },
  smtp: {
    host: 'smtp.dummy.com',
    port: '587',
    user: 'dummyuser',
    pass: 'dummypass',
    senderEmail: 'noreply@frivilligportalen.dk',
  },
  notification_role_defaults: {
    new_task: ['superadmin', 'admin', 'bruger'],
    shift_trade_completed: ['superadmin', 'admin', 'bruger'],
    newsletter: ['superadmin', 'admin', 'bruger'],
  },
  email_templates: {
    password_reset: {
      subject: 'Nulstil din adgangskode til {{siteName}}',
      body: `Hej {{userName}},\n\nDer er blevet anmodet om en nulstilling af din adgangskode.\n\nKlik på linket nedenfor for at oprette en ny adgangskode:\n{{resetLink}}\n\nHvis du ikke har anmodet om dette, kan du se bort fra denne e-mail.\n\nMed venlig hilsen,\n{{siteName}}`,
      deliveryMethod: 'to'
    },
    new_task: {
      subject: 'Ny frivilligopgave: {{taskTitle}}',
      body: `Hej alle,\n\nEn ny frivilligopgave er blevet oprettet og har brug for din hjælp!\n\nOpgave: {{taskTitle}}\nDato: {{taskDate}}\nPoint: {{taskPoints}}\n\nBeskrivelse:\n{{taskDescription}}\n\nTjek den ud på portalen!\n\nMed venlig hilsen,\n{{siteName}}`,
      deliveryMethod: 'bcc'
    },
    shift_trade_completed: {
      subject: 'Dit vagtbytte er gennemført',
      body: `Hej {{offeringUserName}},\n\nDin vagt "{{roleName}}" for vagten "{{shiftTitle}}" d. {{shiftDate}} er blevet overtaget af {{acceptingUserName}}.\n\nDu er ikke længere ansvarlig for denne vagt.\n\nMed venlig hilsen,\n{{siteName}}`,
      deliveryMethod: 'to'
    },
    newsletter: {
      subject: 'Nyhedsbrev fra {{siteName}}',
      body: `Hej alle frivillige,\n\nDette er et nyhedsbrev med de seneste opdateringer fra {{siteName}}.\n\n[Indsæt dit indhold her...]\n\nTak for jeres indsats!\n\nMed venlig hilsen,\nTeamet bag {{siteName}}`,
      deliveryMethod: 'bcc'
    }
  }
};

// --- SHIFT DATA ---
const d = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

export const initialShifts: Shift[] = [
    { id: 'shift1', date: d(5), startTime: '10:00', endTime: '18:00', title: 'Sommerfest - Dag 1', description: 'Hoveddag for sommerfesten.' },
    { id: 'shift2', date: d(6), startTime: '09:00', endTime: '16:00', title: 'Sommerfest - Dag 2', description: 'Oprydningsdag.' },
    { id: 'shift3', date: d(15), startTime: '19:00', endTime: '21:30', title: 'Opfriskningskursus', description: 'Kursus i førstehjælp for alle vagtledere.' },
];

export const initialShiftRoles: ShiftRole[] = [
    // Shift 1
    { id: 'sr1', shiftId: 'shift1', userId: '3', roleName: 'Vagtleder 1' },
    { id: 'sr2', shiftId: 'shift1', userId: '4', roleName: 'Vagtleder 2' },
    { id: 'sr3', shiftId: 'shift1', userId: null, roleName: 'Frivillig 1' },
    { id: 'sr4', shiftId: 'shift1', userId: null, roleName: 'Frivillig 2' },
    { id: 'sr5', shiftId: 'shift1', userId: '2', roleName: 'Tekniker' },
    // Shift 2
    { id: 'sr6', shiftId: 'shift2', userId: null, roleName: 'Oprydning 1' },
    { id: 'sr7', shiftId: 'shift2', userId: null, roleName: 'Oprydning 2' },
    { id: 'sr8', shiftId: 'shift2', userId: null, roleName: 'Oprydning 3' },
    // Shift 3
    { id: 'sr9', shiftId: 'shift3', userId: '3', roleName: 'Deltager' },
    { id: 'sr10', shiftId: 'shift3', userId: '4', roleName: 'Deltager' },
];

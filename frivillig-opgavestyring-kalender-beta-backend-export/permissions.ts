export type PermissionId = 
  | 'access_admin_panel'
  | 'manage_tasks' 
  | 'manage_users' 
  | 'manage_categories'
  | 'manage_settings'
  | 'manage_roles'
  | 'manage_shifts'
  | 'manage_shift_roles' // <--- NY RETTIGHED
  | 'manage_gallery'
  | 'create_task_frontend';

export interface Permission {
  id: PermissionId;
  name: string;
  description: string;
}

export const ALL_PERMISSIONS: Permission[] = [
    { id: 'access_admin_panel', name: 'Adgang til Admin Panel', description: 'Kan se og tilgå admin panelet.'},
    { id: 'manage_tasks', name: 'Administrer Opgaver (Admin)', description: 'Fuld adgang til at oprette, redigere og slette alle opgaver og skabeloner i admin panelet.' },
    { id: 'create_task_frontend', name: 'Opret opgaver (Frontend)', description: 'Tillader brugeren at oprette nye opgaver direkte fra opgavelisten (begrænset til eksisterende kategorier).' },
    { id: 'manage_shifts', name: 'Administrer Vagter', description: 'Kan oprette, redigere og slette vagter og vagtroller.' },
    { id: 'manage_shift_roles', name: 'Administrer Vagtroller', description: 'Kan oprette og slette de faste rolletyper (kategorier) til vagter.' }, // <--- NY
    { id: 'manage_users', name: 'Administrer Brugere', description: 'Kan oprette, redigere og slette brugere, samt nulstille adgangskoder.' },
    { id: 'manage_categories', name: 'Administrer Kategorier', description: 'Kan oprette og slette opgavekategorier.' },
    { id: 'manage_settings', name: 'Administrer Sideindstillinger', description: 'Kan ændre sidens navn, ikon og SMTP-indstillinger.' },
    { id: 'manage_roles', name: 'Administrer Roller & Rettigheder', description: 'Kan oprette, redigere og slette roller og deres rettigheder.' },
    { id: 'manage_gallery', name: 'Administrer Galleri', description: 'Kan uploade, redigere og slette billeder i mediearkivet.' },
];
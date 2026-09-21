import { createClient } from '@supabase/supabase-js';
import { Intervention, TechProfile } from '../types';
import { INITIAL_INTERVENTIONS, INITIAL_EMPLOYEES } from '../data/constants';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pzfcjxjydgopeloxlacg.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GWF5fDuA42RGLsNFCB63kg_S_B89gK7';

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- LOCAL STORAGE PERSISTENCE FALLBACK HELPERS ---
const STORAGE_KEY_INTERVENTIONS = 'cniplc_interventions';
const STORAGE_KEY_EMPLOYEES = 'cniplc_employees';
const STORAGE_KEY_PROFILE = 'cniplc_tech_profile';

function getLocalInterventions(): Intervention[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_INTERVENTIONS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('[Storage] Erreur lecture interventions locales:', e);
  }
  return INITIAL_INTERVENTIONS;
}

function saveLocalInterventions(items: Intervention[]) {
  try {
    localStorage.setItem(STORAGE_KEY_INTERVENTIONS, JSON.stringify(items));
  } catch (e) {
    console.warn('[Storage] Erreur écriture interventions locales:', e);
  }
}

function getLocalEmployees(): Employee[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('[Storage] Erreur lecture employés locaux:', e);
  }
  return INITIAL_EMPLOYEES;
}

function saveLocalEmployees(items: Employee[]) {
  try {
    localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(items));
  } catch (e) {
    console.warn('[Storage] Erreur écriture employés locaux:', e);
  }
}

// --- AUTHENTICATION ---
export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Supabase getSession notice:', error.message || error);
    }
    return data?.session || null;
  } catch (err) {
    console.warn('Supabase unreachable during getSession, using offline fallback');
    return null;
  }
}

export async function getUserProfile(userId: string): Promise<TechProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Notice fetching profile from Supabase:', error.message || error);
    }
    
    if (data) {
      const profile: TechProfile = {
        name: data.name || '',
        title: data.title || '',
        department: data.department || '',
        centerName: data.center_name || ''
      };
      // Cache locally
      try {
        localStorage.setItem(`${STORAGE_KEY_PROFILE}_${userId}`, JSON.stringify(profile));
      } catch (_) {}
      return profile;
    }
  } catch (err) {
    console.warn('Supabase unreachable for getUserProfile, trying local cache');
  }

  // Local fallback
  try {
    const cached = localStorage.getItem(`${STORAGE_KEY_PROFILE}_${userId}`);
    if (cached) return JSON.parse(cached);
  } catch (_) {}

  return null;
}

export async function saveUserProfile(userId: string, profile: TechProfile) {
  // Always save locally first
  try {
    localStorage.setItem(`${STORAGE_KEY_PROFILE}_${userId}`, JSON.stringify(profile));
  } catch (_) {}

  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        name: profile.name,
        title: profile.title,
        department: profile.department,
        center_name: profile.centerName,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.warn('Notice saving profile to Supabase:', error.message || error);
    }
  } catch (err) {
    console.warn('Supabase saveUserProfile offline fallback active');
  }
}

// --- INTERVENTIONS ---
export async function fetchInterventions(): Promise<Intervention[]> {
  try {
    const { data, error } = await supabase
      .from('interventions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      // Synchronize with local storage cache
      saveLocalInterventions(data as Intervention[]);
      return data as Intervention[];
    }

    if (error) {
      console.warn('Supabase fetchInterventions notice:', error.message || error);
    }
  } catch (err) {
    console.warn('Supabase fetchInterventions unreachable, serving local interventions');
  }

  // Graceful offline/local fallback
  return getLocalInterventions();
}

export async function saveIntervention(intervention: Intervention) {
  // 1. Always update local storage first so UI never loses state
  const currentList = getLocalInterventions();
  const existingIndex = currentList.findIndex(i => i.id === intervention.id);
  let updatedList: Intervention[];
  if (existingIndex >= 0) {
    updatedList = [...currentList];
    updatedList[existingIndex] = intervention;
  } else {
    updatedList = [intervention, ...currentList];
  }
  saveLocalInterventions(updatedList);

  // 2. Attempt remote Supabase persistence with error resilience
  try {
    const { error } = await supabase
      .from('interventions')
      .upsert(intervention);

    if (error) {
      console.warn('Notice saving intervention to Supabase:', error.message || error);
    }
  } catch (err) {
    console.warn('Supabase saveIntervention offline fallback active');
  }
}

export async function deleteIntervention(id: string) {
  // 1. Delete locally first
  const currentList = getLocalInterventions();
  const updatedList = currentList.filter(i => i.id !== id);
  saveLocalInterventions(updatedList);

  // 2. Attempt remote Supabase deletion
  try {
    const { error } = await supabase
      .from('interventions')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Notice deleting intervention from Supabase:', error.message || error);
    }
  } catch (err) {
    console.warn('Supabase deleteIntervention offline fallback active');
  }
}

export async function deleteMultipleInterventions(ids: string[]) {
  // 1. Delete locally
  const currentList = getLocalInterventions();
  const idsSet = new Set(ids);
  const updatedList = currentList.filter(i => !idsSet.has(i.id));
  saveLocalInterventions(updatedList);

  // 2. Attempt remote deletion
  try {
    const { error } = await supabase
      .from('interventions')
      .delete()
      .in('id', ids);

    if (error) {
      console.warn('Notice deleting multiple interventions from Supabase:', error.message || error);
    }
  } catch (err) {
    console.warn('Supabase deleteMultipleInterventions offline fallback active');
  }
}

// Auto-cleanup
export async function checkAndCleanupInterventions(interventions: Intervention[], directoryHandle?: FileSystemDirectoryHandle | null): Promise<boolean> {
  const CLEANUP_THRESHOLD = 20;

  if (interventions.length >= CLEANUP_THRESHOLD) {
    try {
      const { generateAutoCleanupReportPDF } = await import('../utils/pdfGenerator');
      
      // Pass the directoryHandle so it can save locally if connected
      await generateAutoCleanupReportPDF(interventions.slice(0, CLEANUP_THRESHOLD), directoryHandle);

      const idsToDelete = interventions
        .slice(0, CLEANUP_THRESHOLD)
        .map(i => i.id)
        .filter(Boolean);

      if (idsToDelete.length > 0) {
        await deleteMultipleInterventions(idsToDelete);
      }

      return true;
    } catch (err) {
      console.error('Auto-cleanup failed:', err);
      return false;
    }
  }
  return false;
}

// --- EMPLOYEES ---
export interface Employee {
  id?: string;
  name: string;
  title: string;
  department: string;
  created_at?: string;
  user_id?: string;
}

export async function fetchEmployees(): Promise<Employee[]> {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      saveLocalEmployees(data as Employee[]);
      return data as Employee[];
    }

    if (error) {
      console.warn('Notice fetching employees from Supabase:', error.message || error);
    }
  } catch (err) {
    console.warn('Supabase fetchEmployees unreachable, serving local directory');
  }

  return getLocalEmployees();
}

export async function saveEmployee(employee: Employee) {
  // Update locally first
  const currentList = getLocalEmployees();
  const existingIndex = currentList.findIndex(e => e.id === employee.id);
  let updatedList: Employee[];
  if (existingIndex >= 0) {
    updatedList = [...currentList];
    updatedList[existingIndex] = employee;
  } else {
    updatedList = [...currentList, employee];
  }
  saveLocalEmployees(updatedList);

  try {
    const { error } = await supabase
      .from('employees')
      .upsert(employee);

    if (error) {
      console.warn('Notice saving employee to Supabase:', error.message || error);
    }
  } catch (err) {
    console.warn('Supabase saveEmployee offline fallback active');
  }
}

export async function deleteEmployee(id: string) {
  const currentList = getLocalEmployees();
  const updatedList = currentList.filter(e => e.id !== id);
  saveLocalEmployees(updatedList);

  try {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Notice deleting employee from Supabase:', error.message || error);
    }
  } catch (err) {
    console.warn('Supabase deleteEmployee offline fallback active');
  }
}

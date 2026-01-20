import { supabase } from "@/integrations/supabase/client";

export interface Coach {
  id: string;
  team_id: string | null;
  name: string;
  photo_url: string | null;
  tenure_start: string;
  tenure_end: string | null;
  tenure_summary: string | null;
  wins: number;
  losses: number;
  playoff_wins: number;
  playoff_losses: number;
  championships: number;
  is_current: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CoachWithTeam extends Coach {
  teams?: {
    id: string;
    name: string;
  } | null;
}

export const coachesApi = {
  // Get all coaches with team info
  async getAll(): Promise<CoachWithTeam[]> {
    const { data, error } = await supabase
      .from('coaches')
      .select(`
        *,
        teams:team_id (id, name)
      `)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data as CoachWithTeam[];
  },

  // Get coaches by team
  async getByTeam(teamId: string): Promise<Coach[]> {
    const { data, error } = await supabase
      .from('coaches')
      .select('*')
      .eq('team_id', teamId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data as Coach[];
  },

  // Get all coaches grouped by team
  async getAllGroupedByTeam(): Promise<Map<string, { teamName: string; coaches: Coach[] }>> {
    const { data, error } = await supabase
      .from('coaches')
      .select(`
        *,
        teams:team_id (id, name)
      `)
      .order('display_order', { ascending: true });

    if (error) throw error;

    const groupedMap = new Map<string, { teamName: string; coaches: Coach[] }>();
    
    for (const coach of data as CoachWithTeam[]) {
      if (!coach.team_id || !coach.teams) continue;
      
      const existing = groupedMap.get(coach.team_id);
      if (existing) {
        existing.coaches.push(coach);
      } else {
        groupedMap.set(coach.team_id, {
          teamName: coach.teams.name,
          coaches: [coach]
        });
      }
    }

    return groupedMap;
  },

  // Create coach
  async create(coach: Omit<Coach, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('coaches')
      .insert([coach])
      .select()
      .single();

    if (error) throw error;
    return data as Coach;
  },

  // Update coach
  async update(id: string, updates: Partial<Omit<Coach, 'id' | 'created_at' | 'updated_at'>>) {
    const { data, error } = await supabase
      .from('coaches')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Coach;
  },

  // Delete coach
  async delete(id: string) {
    const { error } = await supabase
      .from('coaches')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Upload coach image
  async uploadImage(file: File, coachId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${coachId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('coach-images')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('coach-images')
      .getPublicUrl(filePath);

    return publicUrl;
  }
};

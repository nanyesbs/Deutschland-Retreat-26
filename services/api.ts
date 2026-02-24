import { Participant } from '../types';
import { fixEncoding } from '../utils';
import { supabase } from './supabase';

const mapToDb = (participant: Partial<Participant>) => {
  const mapped: any = { ...participant };

  // Map camelCase fields to expected lowercase DB column names
  if (participant.shortBio !== undefined) mapped.shortbio = participant.shortBio;
  if (participant.contactEmail !== undefined) mapped.contactemail = participant.contactEmail;
  if (participant.upcomingEvents !== undefined) mapped.upcomingevents = participant.upcomingEvents;
  if (participant.dietaryRestrictions !== undefined) mapped.dietaryrestrictions = participant.dietaryRestrictions;
  if (participant.socialMedia !== undefined) mapped.socialmedia = participant.socialMedia;
  if (participant.isWhatsapp !== undefined) mapped.iswhatsapp = participant.isWhatsapp;
  if (participant.otherInfo !== undefined) mapped.othercontact = participant.otherInfo;
  if (participant.promoPhotoUrl !== undefined) mapped.promopicture = participant.promoPhotoUrl;

  // Clean up camelCase keys that have a lowercase equivalent in the database
  const keysToClean = [
    'shortBio', 'contactEmail',
    'upcomingEvents', 'dietaryRestrictions',
    'socialMedia', 'isWhatsapp', 'otherInfo', 'promoPhotoUrl'
  ];
  keysToClean.forEach(key => delete mapped[key]);

  return mapped;
};

export const api = {
  getParticipants: async (): Promise<Participant[]> => {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase get error:', error);
      return [];
    }
    return data as Participant[];
  },

  addParticipant: async (participant: Omit<Participant, 'id'>): Promise<Participant> => {
    // Generate a fallback email if it's completely missing, to bypass RLS/NOT NULL constraints
    const safeEmail = participant.email ? participant.email : `admin_${Date.now()}@temp.esbs.org`;

    const newParticipant = {
      ...participant,
      email: safeEmail,
      id: Math.random().toString(36).substring(2, 7).toUpperCase(),
    };

    const dbParticipant = mapToDb(newParticipant);
    const { data, error } = await supabase
      .from('participants')
      .upsert([dbParticipant], { onConflict: 'email' })
      .select()
      .single();

    if (error) throw error;

    // Also sync the addition to leaders table to ensure parity
    try {
      await api.saveLeader(newParticipant);
    } catch (e) {
      console.warn('Leader sync warning:', e);
    }

    return data as Participant;
  },

  upsertParticipant: async (participant: Omit<Participant, 'id'>): Promise<Participant> => {
    const safeEmail = participant.email ? participant.email : `admin_${Date.now()}@temp.esbs.org`;
    const dbParticipant = mapToDb({ ...participant, email: safeEmail });

    const { data, error } = await supabase
      .from('participants')
      .upsert(dbParticipant, { onConflict: 'email' })
      .select()
      .single();

    if (error) throw error;
    return data as Participant;
  },

  bulkUpsertParticipants: async (participants: Omit<Participant, 'id'>[]): Promise<void> => {
    const dbParticipants = participants.map(p => mapToDb({
      ...p,
      email: p.email ? p.email : `admin_${Date.now()}@temp.esbs.org`
    }));
    const { error } = await supabase
      .from('participants')
      .upsert(dbParticipants, { onConflict: 'email' });

    if (error) throw error;
  },

  updateParticipant: async (id: string, updates: Partial<Participant>): Promise<Participant> => {
    const dbUpdates = mapToDb(updates);
    const { data, error } = await supabase
      .from('participants')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Participant;
  },

  deleteParticipant: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  resetData: async (): Promise<void> => {
    // Caution: This deletes everything
    const { error } = await supabase
      .from('participants')
      .delete()
      .neq('id', '0'); // Safe way to clear all if allowed by RLS

    if (error) throw error;
  },

  getSettings: async (): Promise<Record<string, string>> => {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) return {};
    const settings: Record<string, string> = {};
    data.forEach(s => settings[s.id] = s.value);
    return settings;
  },

  uploadImage: async (file: File, path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('picture')
      .upload(`${Date.now()}-${path}`, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('picture')
      .getPublicUrl(data.path);

    return publicUrl;
  },

  saveLeader: async (leaderData: any): Promise<void> => {
    // Save to 'leaders' table (registration log)
    // We maintain the explicit mapping for the legacy 'leaders' table if it has different column names
    const leaderPayload = {
      email: leaderData.email,
      fullname: leaderData.name,
      residentcountry: leaderData.country?.name,
      nationality: leaderData.nationality?.name,
      shortbio: leaderData.shortBio,
      profilepicture: leaderData.photoUrl,
      ministryname: leaderData.organization,
      roles: leaderData.title,
      ministrydescription: leaderData.orgDescription,
      promopicture: leaderData.promoPhotoUrl,
      phone: leaderData.phone,
      iswhatsapp: leaderData.isWhatsapp ?? false,
      socialmedia: leaderData.socialMedia ?? [],
      contactemail: leaderData.contactEmail,
      website: leaderData.website,
      othercontact: leaderData.otherInfo,
      testimony: leaderData.testimony,
      upcomingevents: leaderData.upcomingEvents,
      dietaryrestrictions: leaderData.dietaryRestrictions
    };

    const { error: leaderError } = await supabase
      .from('leaders')
      .upsert([leaderPayload], { onConflict: 'email' });

    if (leaderError) throw leaderError;

    // Also upsert into 'participants' so the directory shows the new entry
    const dbParticipant = mapToDb(leaderData);
    const { error: participantError } = await supabase
      .from('participants')
      .upsert([dbParticipant], { onConflict: 'email' });

    if (participantError) throw participantError;
  },
};

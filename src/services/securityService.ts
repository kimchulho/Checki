/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase } from './supabaseClient';
import { nanoid } from 'nanoid';

const ENCRYPTION_SECRET = import.meta.env.VITE_ENCRYPTION_SECRET || 'default-secret-key-must-be-32-chars!!';

/**
 * Encrypts a Blob using AES-256-GCM.
 */
export async function encryptBlob(blob: Blob): Promise<{ encryptedBlob: Blob; iv: Uint8Array }> {
  const arrayBuffer = await blob.arrayBuffer();
  
  // Import the secret key
  const encoder = new TextEncoder();
  const keyData = encoder.encode(ENCRYPTION_SECRET.padEnd(32, '0').slice(0, 32));
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Generate a random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt the data
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    arrayBuffer
  );

  return {
    encryptedBlob: new Blob([encryptedBuffer], { type: 'application/octet-stream' }),
    iv
  };
}

/**
 * Decrypts a Blob using AES-256-GCM.
 */
export async function decryptBlob(encryptedBlob: Blob, ivString: string): Promise<Blob> {
  const arrayBuffer = await encryptedBlob.arrayBuffer();
  const iv = new Uint8Array(atob(ivString).split('').map(c => c.charCodeAt(0)));

  // Import the secret key
  const encoder = new TextEncoder();
  const keyData = encoder.encode(ENCRYPTION_SECRET.padEnd(32, '0').slice(0, 32));
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // Decrypt the data
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    arrayBuffer
  );

  return new Blob([decryptedBuffer], { type: 'image/jpeg' });
}

/**
 * Uploads attendance data to Supabase.
 * Table name: checki_history
 * Storage bucket: checki-attendance-images
 */
export async function uploadAttendanceData(
  childName: string, 
  encryptedBlob?: Blob | null, 
  iv?: Uint8Array | null, 
  placeId?: string, 
  activityType?: string,
  terminalId?: string,
  lat?: number,
  lng?: number,
  terminalName?: string,
  childId?: string
) {
  if (!supabase) {
    throw new Error('Supabase client is not initialized. Please check your environment variables.');
  }
  try {
    const timestamp = new Date().toISOString();
    let combinedUrl = null;

    if (encryptedBlob && iv) {
      const fileName = `${nanoid()}_${Date.now()}.enc`;
      const ivString = btoa(String.fromCharCode(...iv));

      // 1. Upload encrypted image to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('checki-attendance-images')
        .upload(fileName, encryptedBlob, {
          contentType: 'application/octet-stream',
          upsert: false
        });

      if (uploadError) {
        console.error('[Supabase Storage] Upload error:', uploadError);
        throw uploadError;
      }
      combinedUrl = `${fileName}|${ivString}`;
    }

    // 2. Record attendance in the DB
    const { error: dbError } = await supabase
      .from('checki_history')
      .insert([
        { 
          child_name: childName, 
          child_id: childId || null, // Ensure it's null if not provided or if it's an edu member (handled by caller)
          image_url: combinedUrl,
          place_id: placeId,
          activity_type: activityType,
          terminal_id: terminalId,
          terminal_name: terminalName,
          lat: lat,
          lng: lng
        }
      ]);

    if (dbError) {
      console.error('[Supabase DB] History insert error:', dbError);
      throw dbError;
    }

    console.log(`[Supabase] Recorded attendance and image for student: ${childName}`);
    return true;
  } catch (error) {
    console.error('[Supabase] Full upload failed:', error);
    throw error; // Re-throw to let the caller handle it
  }
}

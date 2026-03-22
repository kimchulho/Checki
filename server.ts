import express from "express";
import webpush from "web-push";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Lazy initialization for Supabase to prevent crash if env vars are missing
let supabaseClient: any = null;
const getSupabase = () => {
  if (!supabaseClient) {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.warn("⚠️ Supabase environment variables are missing. Database features will not work.");
      return null;
    }
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
};

// Lazy initialization for Supabase Admin (Service Role)
const getSupabaseAdmin = () => {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn("⚠️ Supabase Service Role Key is missing. Admin features will not work.");
    return null;
  }
  return createClient(url, key);
};

// VAPID keys should be generated once and kept secret.
const vapidKeys = {
  publicKey: (process.env.VAPID_PUBLIC_KEY || "").trim(),
  privateKey: (process.env.VAPID_PRIVATE_KEY || "").trim(),
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  try {
    webpush.setVapidDetails(
      "mailto:example@yourdomain.com",
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
  } catch (err) {
    console.error("Failed to set VAPID details:", err);
  }
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV, version: "1.0.1" });
  });

  // API Routes
  app.get("/api/vapid-public-key", (req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
  });

  app.post("/api/send-attendance-notification", async (req, res) => {
    console.log("Received notification trigger request:", req.body);
    const { childName, placeId, activity_type, mode } = req.body;
    const action = activity_type || mode; // Support both for backward compatibility

    const supabase = getSupabase();

    if (!supabase) {
      return res.status(500).json({ error: "Supabase not configured" });
    }

    if (!childName) {
      return res.status(400).json({ error: "Child Name is required" });
    }

    try {
      // 1. Fetch member info to verify they exist and get their place_id
      let member: any = null;
      let memberError: any = null;

      const { data: homeMember, error: homeError } = await supabase
        .from('checki_members')
        .select('id, name, place_id')
        .eq('name', childName)
        .eq('place_id', placeId)
        .single();

      if (homeMember) {
        member = homeMember;
      } else {
        const { data: eduMember, error: eduError } = await supabase
          .from('checki_edu_members')
          .select('id, name, place_id, home_member_id')
          .eq('name', childName)
          .eq('place_id', placeId)
          .single();
        
        if (eduMember) {
          member = eduMember;
        } else {
          memberError = eduError || homeError;
        }
      }

      if (memberError || !member) {
        console.warn(`Member not found for notification: ${childName} at place ${placeId}`);
        return res.status(404).json({ error: "Member not found" });
      }

      const targetPlaceId = member.place_id;

      // 2. Fetch all subscriptions associated with this place_id (admins) and this member_code (parents)
      const { data: adminSubscriptions, error: adminSubError } = await supabase
        .from('checki_push_subscriptions')
        .select('subscription')
        .eq('place_id', targetPlaceId);

      // Parent subscriptions can be linked to member.id or member.home_member_id
      const memberIds = [member.id];
      if (member.home_member_id) memberIds.push(member.home_member_id);

      const { data: parentSubscriptions, error: parentSubError } = await supabase
        .from('checki_push_subscriptions')
        .select('subscription, phone_number')
        .in('member_code', memberIds);

      if (adminSubError) throw adminSubError;
      if (parentSubError) throw parentSubError;

      const allSubscriptions = [
        ...(adminSubscriptions || []).map(s => ({ ...s, type: 'admin' })),
        ...(parentSubscriptions || []).map(s => ({ ...s, type: 'parent' }))
      ];

      if (allSubscriptions.length === 0) {
        console.log(`No subscribers found for place_id: ${targetPlaceId} or member_code: ${member.id}`);
        return res.json({ success: true, sentCount: 0 });
      }

      // Remove duplicates based on endpoint, keeping the first one found
      const uniqueSubscriptions = Array.from(new Set(allSubscriptions.map(s => {
        const sub = typeof s.subscription === 'string' ? JSON.parse(s.subscription) : s.subscription;
        return sub.endpoint;
      }))).map(endpoint => {
        const found = allSubscriptions.find(s => {
          const sub = typeof s.subscription === 'string' ? JSON.parse(s.subscription) : s.subscription;
          return sub.endpoint === endpoint;
        });
        return {
          subscription: typeof found.subscription === 'string' ? JSON.parse(found.subscription) : found.subscription,
          type: found.type,
          phone_number: found.phone_number
        };
      });

      // 3. Send notifications
      console.log(`Sending notifications to ${uniqueSubscriptions.length} subscribers for ${childName}`);
      
      // Helper to determine '이가' or '가' based on Korean batchim
      const getParticle = (name: string) => {
        const lastChar = name.charCodeAt(name.length - 1);
        if (lastChar < 0xAC00 || lastChar > 0xD7A3) return '가'; // Default for non-Korean
        return (lastChar - 0xAC00) % 28 > 0 ? '이가' : '가';
      };

      const actionText = action || '등원';
      const particle = getParticle(childName);
      
      const timeString = new Date().toLocaleTimeString('ko-KR', {
        timeZone: 'Asia/Seoul',
        hour12: true,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit'
      });
      
      const results = await Promise.allSettled(
        uniqueSubscriptions.map(subInfo => {
          let targetUrl = '/';
          if (subInfo.type === 'admin') {
            targetUrl = `/admin?autoLogin=true&placeId=${targetPlaceId}`;
          } else if (subInfo.type === 'parent') {
            targetUrl = `/history/${targetPlaceId}?autoLogin=true&id=${member.id}&key=${subInfo.phone_number}`;
          }

          const customPayload = {
            title: `[체키] ${childName} ${actionText} 알림`,
            body: `${childName}${particle} ${actionText} 했어요! (${timeString})`,
            icon: '/icon.svg', // Orange square with check icon
            badge: '/badge.svg',
            url: targetUrl, // For old service workers
            data: { url: targetUrl }, // For new service workers
            timestamp: Date.now()
          };

          return webpush.sendNotification(subInfo.subscription, JSON.stringify(customPayload));
        })
      );

      res.json({ 
        success: true, 
        sentCount: results.filter(r => r.status === 'fulfilled').length 
      });
    } catch (error: any) {
      console.error("Error in notification trigger:", error);
      res.status(500).json({ error: "Failed to process notification" });
    }
  });

  // School Registration Endpoint
  app.post("/api/lookup-email", async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username is required" });

    const supabase = getSupabaseAdmin();
    if (!supabase) return res.status(500).json({ error: "Server configuration error" });

    try {
      const { data, error } = await supabase
        .from('checki_places')
        .select('email')
        .eq('username', username)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ email: data.email });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/register-school", async (req, res) => {
    const { user_id, username, email, name, contact_phone, mode } = req.body;

    if (!user_id || !username || !name || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    try {
      // Insert new place linked to Supabase Auth user_id
      const { data, error } = await supabase
        .from('checki_places')
        .insert([
          {
            user_id,
            username,
            email,
            name,
            contact_phone: contact_phone || null,
            mode: mode || 'home'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ success: true, place: data });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // School Login Sync Endpoint
  app.post("/api/login-sync", async (req, res) => {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    try {
      const { data: place, error } = await supabase
        .from('checki_places')
        .select('*')
        .eq('user_id', user_id)
        .single();

      if (error || !place) {
        return res.status(404).json({ error: "Place info not found" });
      }

      res.json({ success: true, place });
    } catch (error: any) {
      console.error("Login sync error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Account Deletion Endpoint
  app.post("/api/delete-account", async (req, res) => {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    try {
      // Get place_id first
      const { data: placeData, error: placeError } = await supabase
        .from('checki_places')
        .select('id')
        .eq('user_id', user_id)
        .single();

      if (placeError && placeError.code !== 'PGRST116') {
        throw placeError;
      }

      if (placeData) {
        const placeId = placeData.id;

        // Delete attendance records related to this place
        await supabase.from('checki_attendance').delete().eq('place_id', placeId);
        
        // Delete terminals related to this place
        await supabase.from('checki_terminals').delete().eq('place_id', placeId);
        
        // Delete members related to this place
        await supabase.from('checki_members').delete().eq('place_id', placeId);
        await supabase.from('checki_edu_members').delete().eq('place_id', placeId);

        // Delete place info
        const { error: dbError } = await supabase
          .from('checki_places')
          .delete()
          .eq('id', placeId);

        if (dbError) throw dbError;
      }

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(user_id);
      
      if (authError) throw authError;

      res.json({ success: true });
    } catch (error: any) {
      console.error("Account deletion error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Kiosk Registration Token Generation
  app.post("/api/kiosk/generate-token", async (req, res) => {
    const { placeId } = req.body;
    if (!placeId) return res.status(400).json({ error: "Place ID is required" });

    const supabase = getSupabaseAdmin();
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

    try {
      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      const { error } = await supabase
        .from('checki_kiosk_tokens')
        .insert([{ place_id: placeId, token, expires_at: expiresAt }]);

      if (error) throw error;

      res.json({ token });
    } catch (error: any) {
      console.error("Token generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Kiosk Registration Token Verification
  app.post("/api/kiosk/verify-token", async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token is required" });

    const supabase = getSupabaseAdmin();
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

    try {
      const { data, error } = await supabase
        .from('checki_kiosk_tokens')
        .select('place_id, expires_at')
        .eq('token', token)
        .single();

      if (error || !data) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }

      if (new Date(data.expires_at) < new Date()) {
        return res.status(400).json({ error: "Token has expired" });
      }

      // Fetch place info
      const { data: place, error: placeError } = await supabase
        .from('checki_places')
        .select('*')
        .eq('id', data.place_id)
        .single();

      if (placeError || !place) {
        return res.status(404).json({ error: "Place not found" });
      }

      // Determine the new terminal name
      const { data: existingTerminals } = await supabase
        .from('checki_terminals')
        .select('name')
        .eq('place_id', data.place_id);
      
      const baseName = place.mode === 'edu' ? '정문 단말기' : place.mode === 'business' ? '출입구 단말기' : '우리 집';
      let terminalName = baseName;
      
      if (existingTerminals && existingTerminals.length > 0) {
        const names = existingTerminals.map((t: any) => t.name);
        if (names.includes(baseName)) {
          let counter = 1;
          while (names.includes(`${baseName} ${counter}`)) {
            counter++;
          }
          terminalName = `${baseName} ${counter}`;
        }
      }

      const defaultActivities = place.mode === 'edu' ? ['등원', '하원'] : place.mode === 'business' ? ['출근', '퇴근'] : ['집', '학교', '외출'];

      // Create a new terminal entry
      const { data: terminal, error: terminalError } = await supabase
        .from('checki_terminals')
        .insert([{ 
          place_id: data.place_id, 
          name: terminalName,
          activities: defaultActivities
        }])
        .select()
        .single();

      if (terminalError) throw terminalError;

      // Delete the used token
      await supabase.from('checki_kiosk_tokens').delete().eq('token', token);

      const { password_hash, kiosk_password_hash, ...placeInfo } = place;
      res.json({ success: true, place: placeInfo, terminalId: terminal.id, terminalName: terminal.name });
    } catch (error: any) {
      console.error("Token verification error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // List Terminals
  app.get("/api/terminals/:placeId", async (req, res) => {
    const { placeId } = req.params;
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

    try {
      const { data, error } = await supabase
        .from('checki_terminals')
        .select('*')
        .eq('place_id', placeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update Student
  app.post("/api/students", async (req, res) => {
    const { placeId, userId, name, isEdu, birth_date, class_name, parent_contact, member_code } = req.body;
    const supabase = getSupabaseAdmin() || getSupabase();
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

    const targetTable = isEdu ? 'checki_edu_members' : 'checki_members';

    try {
      // Check if name already exists for this school
      const { data: existing, error: checkError } = await supabase
        .from(targetTable)
        .select('name')
        .eq('name', name)
        .eq('place_id', placeId)
        .limit(1);

      if (existing && existing.length > 0) {
        return res.status(400).json({ error: "이미 등록된 이름입니다." });
      }

      let memberData: any = {
        name,
        place_id: placeId,
        ...(userId && { user_id: userId })
      };

      if (isEdu) {
        memberData = {
          ...memberData,
          birth_date: birth_date || null,
          class_name: class_name || null,
          parent_contact: parent_contact || null,
          member_code: member_code || null
        };
      }

      const { data, error } = await supabase
        .from(targetTable)
        .insert([memberData])
        .select()
        .single();
        
      if (error) throw error;

      res.status(201).json({ success: true, student: data });
    } catch (error: any) {
      console.error("Error creating student:", error);
      res.status(500).json({ error: error.message || "학생 등록에 실패했습니다." });
    }
  });

  app.put("/api/students/:studentId", async (req, res) => {
    const { studentId } = req.params;
    const { placeId, name, isEdu, birth_date, class_name, parent_contact, member_code } = req.body;
    const supabase = getSupabaseAdmin() || getSupabase();
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

    const targetTable = isEdu ? 'checki_edu_members' : 'checki_members';

    try {
      // 1. Fetch old student name to update history
      const { data: oldStudent } = await supabase
        .from(targetTable)
        .select('name')
        .eq('id', studentId)
        .single();

      // 2. Update the student record
      let updateData: any = { name };
      if (isEdu) {
        updateData = {
          ...updateData,
          birth_date: birth_date || null,
          class_name: class_name || null,
          parent_contact: parent_contact || null,
          member_code: member_code || null
        };
      }

      let query = supabase
        .from(targetTable)
        .update(updateData)
        .eq('id', studentId);
        
      if (placeId) {
        query = query.eq('place_id', placeId);
      }

      const { error } = await query;
      if (error) throw error;

      // 3. Update history if name changed (for backward compatibility with old records)
      if (oldStudent && oldStudent.name !== name && placeId) {
        await supabase
          .from('checki_history')
          .update({ child_name: name })
          .eq('place_id', placeId)
          .eq('child_name', oldStudent.name);
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Generate Invite Code
  app.post("/api/students/:studentId/invite", async (req, res) => {
    const { studentId } = req.params;
    const { placeId } = req.query;
    const supabase = getSupabaseAdmin() || getSupabase();
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error } = await supabase
        .from('checki_edu_members')
        .update({ invite_code: code })
        .eq('id', studentId)
        .eq('place_id', placeId as string);

      if (error) throw error;
      res.json({ success: true, invite_code: code });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Link Home Student to Edu Student
  app.post("/api/students/:studentId/link", async (req, res) => {
    const { studentId } = req.params;
    const { invite_code } = req.body;
    const supabase = getSupabaseAdmin() || getSupabase();
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

    try {
      // 1. Find the edu student with the given invite code
      const { data: eduStudent, error: findError } = await supabase
        .from('checki_edu_members')
        .select('id')
        .eq('invite_code', invite_code)
        .single();

      if (findError || !eduStudent) {
        return res.status(400).json({ error: "유효하지 않은 초대 코드입니다." });
      }

      // 2. Link the home student to the edu student
      const { error: updateError } = await supabase
        .from('checki_edu_members')
        .update({ home_member_id: studentId })
        .eq('id', eduStudent.id);

      if (updateError) throw updateError;
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Unlink Home Student from Edu Student
  app.post("/api/students/:studentId/unlink", async (req, res) => {
    const { studentId } = req.params;
    const { edu_member_id } = req.body;
    const supabase = getSupabaseAdmin() || getSupabase();
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

    try {
      // Unlink the home student from the specific edu student
      const { error: updateError } = await supabase
        .from('checki_edu_members')
        .update({ home_member_id: null })
        .eq('id', edu_member_id)
        .eq('home_member_id', studentId);

      if (updateError) throw updateError;
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete Student
  app.delete("/api/students/:studentId", async (req, res) => {
    const { studentId } = req.params;
    const { placeId, isEdu } = req.query;
    const supabase = getSupabaseAdmin() || getSupabase();
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

    const targetTable = isEdu === 'true' ? 'checki_edu_members' : 'checki_members';

    try {
      // 0. Fetch student name to delete history
      const { data: student } = await supabase
        .from(targetTable)
        .select('name')
        .eq('id', studentId)
        .single();

      // 1. Delete associated push subscriptions first
      await supabase
        .from('checki_push_subscriptions')
        .delete()
        .eq('member_code', studentId);

      // 2. Delete history if it exists
      if (placeId) {
        // Delete by child_id (new records)
        await supabase
          .from('checki_history')
          .delete()
          .eq('place_id', placeId)
          .eq('child_id', studentId);
          
        // Delete by child_name (for backward compatibility with old records)
        if (student?.name) {
          await supabase
            .from('checki_history')
            .delete()
            .eq('place_id', placeId)
            .eq('child_name', student.name);
        }
      }

      // 3. Delete the student record
      let query = supabase
        .from(targetTable)
        .delete()
        .eq('id', studentId);
        
      if (placeId) {
        query = query.eq('place_id', placeId);
      }

      const { error } = await query;

      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete Terminal
  app.delete("/api/terminals/:terminalId", async (req, res) => {
    const { terminalId } = req.params;
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

    try {
      const { error } = await supabase
        .from('checki_terminals')
        .delete()
        .eq('id', terminalId);

      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update Terminal
  app.put("/api/terminals/:terminalId", async (req, res) => {
    const { terminalId } = req.params;
    const { name, activities } = req.body;
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

    try {
      const updateData: any = { name };
      if (activities !== undefined) {
        updateData.activities = activities;
      }
      const { error } = await supabase
        .from('checki_terminals')
        .update(updateData)
        .eq('id', terminalId);

      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update Terminal Location
  app.post("/api/terminals/:terminalId/location", async (req, res) => {
    const { terminalId } = req.params;
    const { lat, lng } = req.body;
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

    try {
      const { data, error } = await supabase
        .from('checki_terminals')
        .update({ 
          last_lat: lat, 
          last_lng: lng, 
          last_seen_at: new Date().toISOString() 
        })
        .eq('id', terminalId)
        .select('id');

      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ error: "Terminal not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Check Terminal Status
  app.get("/api/terminals/:terminalId/status", async (req, res) => {
    const { terminalId } = req.params;
    const supabase = getSupabaseAdmin();
    if (!supabase) return res.status(500).json({ error: "Supabase not configured" });

    try {
      const { data, error } = await supabase
        .from('checki_terminals')
        .select('id, name, activities')
        .eq('id', terminalId)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: "Terminal not found" });
      }
      res.json({ status: "active", name: data.name, activities: data.activities });
    } catch (error: any) {
      res.status(404).json({ error: "Terminal not found" });
    }
  });

  // Send notification to a specific student's subscribers
  app.post("/api/attendance/:id/view", async (req, res) => {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return res.status(500).json({ error: "Server configuration error: Missing Service Role Key" });
    }

    try {
      const { error } = await supabase
        .from('checki_history')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error updating viewed_at:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/attendance/:id", async (req, res) => {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    try {
      // 1. Get the image path first
      const { data: item, error: fetchError } = await supabase
        .from('checki_history')
        .select('image_url')
        .eq('id', id)
        .single();

      if (fetchError || !item) {
        return res.status(404).json({ error: "Record not found" });
      }

      // 2. Delete from storage if photo exists
      if (item.image_url) {
        const [imagePath] = item.image_url.split('|');
        
        const { error: storageError } = await supabase
          .storage
          .from('checki-attendance-images')
          .remove([imagePath]);

        if (storageError) {
          console.error("Storage deletion error during record deletion:", storageError);
          // Continue anyway to delete the DB record
        }
      }

      // 3. Delete the database record
      const { error: dbError } = await supabase
        .from('checki_history')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting attendance record:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/attendance/:id/photo", async (req, res) => {
    const { id } = req.params;
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    try {
      // 1. Get the image path first
      const { data: item, error: fetchError } = await supabase
        .from('checki_history')
        .select('image_url')
        .eq('id', id)
        .single();

      if (fetchError || !item) {
        return res.status(404).json({ error: "Record not found" });
      }

      if (item.image_url) {
        const [imagePath] = item.image_url.split('|');
        
        // 2. Delete from storage
        const { error: storageError } = await supabase
          .storage
          .from('checki-attendance-images')
          .remove([imagePath]);

        if (storageError) {
          console.error("Storage deletion error:", storageError);
          // Continue anyway to clear the DB record if storage fails (maybe it was already gone)
        }
      }

      // 3. Update database record
      const { error: dbError } = await supabase
        .from('checki_history')
        .update({ image_url: null })
        .eq('id', id);

      if (dbError) throw dbError;

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting photo:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/send-notification", async (req, res) => {
    const { subscription, payload } = req.body;

    if (!subscription) {
      return res.status(400).json({ error: "Subscription is required" });
    }

    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Polar Checkout Endpoint
  app.post("/api/checkout/polar", async (req, res) => {
    const { plan, placeId, successUrl } = req.body;

    if (!plan || !placeId || !successUrl) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
    if (!polarAccessToken) {
      console.error("POLAR_ACCESS_TOKEN is not set");
      return res.status(500).json({ error: "Polar is not configured" });
    }

    const monthlyId = process.env.POLAR_MONTHLY_PRODUCT_ID || '65befb36-c2a6-4170-95e6-187bb5d1b71b';
    const yearlyId = process.env.POLAR_YEARLY_PRODUCT_ID || '40e6eb6f-187f-41c4-9b90-fe12625d4591';
    const productId = plan === 'monthly' ? monthlyId : yearlyId;
    
    const polarApiUrl = process.env.POLAR_API_URL || 'https://sandbox-api.polar.sh';

    try {
      const response = await fetch(`${polarApiUrl}/v1/checkouts/custom/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${polarAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: productId,
          success_url: successUrl,
          metadata: {
            place_id: placeId
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Polar checkout error:", errorData);
        throw new Error("Failed to create Polar checkout");
      }

      const data = await response.json();
      res.json({ url: data.url });
    } catch (error) {
      console.error("Error creating checkout:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Polar Customer Portal Endpoint
  app.post("/api/portal/polar", async (req, res) => {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: "Missing customerId" });
    }

    const polarAccessToken = process.env.POLAR_ACCESS_TOKEN;
    if (!polarAccessToken) {
      console.error("POLAR_ACCESS_TOKEN is not set");
      return res.status(500).json({ error: "Polar is not configured" });
    }

    const polarApiUrl = process.env.POLAR_API_URL || 'https://sandbox-api.polar.sh';

    try {
      const response = await fetch(`${polarApiUrl}/v1/customer-sessions/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${polarAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Polar API error:", errorText);
        return res.status(response.status).json({ error: "Failed to create customer session" });
      }

      const data = await response.json();
      res.json({ url: data.customer_portal_url });
    } catch (error) {
      console.error("Error creating customer session:", error);
      res.status(500).json({ error: "Failed to create customer session" });
    }
  });

  // Polar Webhook Endpoint
  app.post("/api/webhooks/polar", async (req, res) => {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(500).json({ error: "Supabase Admin not configured" });
    }

    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("POLAR_WEBHOOK_SECRET is not set");
      return res.status(500).send("Webhook secret not configured");
    }

    try {
      // Since express.json() is applied globally, req.body is already a parsed object
      const payload = req.body;
      console.log("Received Polar webhook:", payload.type);

      const eventType = payload.type;
      const data = payload.data;

      if (eventType === 'subscription.created' || eventType === 'subscription.updated') {
        const { id: polar_subscription_id, customer_id: polar_customer_id, status, product_id, current_period_end, metadata } = data;
        
        // Extract place_id from metadata (passed during checkout creation)
        const place_id = metadata?.place_id;

        if (!place_id) {
          console.warn(`[Polar Webhook] No place_id found in subscription metadata for sub ${polar_subscription_id}. Ignoring event.`);
          // Return 200 instead of 400 so Polar doesn't keep retrying an event we can't process anyway
          return res.status(200).send("Ignored: Missing place_id in metadata");
        }

        const monthlyId = process.env.POLAR_MONTHLY_PRODUCT_ID || '65befb36-c2a6-4170-95e6-187bb5d1b71b';
        const yearlyId = process.env.POLAR_YEARLY_PRODUCT_ID || '40e6eb6f-187f-41c4-9b90-fe12625d4591';

        // Determine plan based on product_id
        const plan_id = product_id === monthlyId ? 'monthly' : 
                        product_id === yearlyId ? 'yearly' : 'unknown';

        // Upsert subscription record
        const { error } = await supabase
          .from('checki_subscriptions')
          .upsert({
            place_id,
            polar_subscription_id,
            polar_customer_id,
            status,
            plan_id,
            current_period_end: current_period_end ? new Date(current_period_end).toISOString() : null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'polar_subscription_id' });

        if (error) {
          console.error("Error upserting subscription:", error);
          return res.status(500).send("Database error");
        }
        
        console.log(`Successfully processed subscription ${polar_subscription_id} for place ${place_id}`);
      }

      res.status(200).send("Webhook processed");
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(400).send("Webhook error");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    (async () => {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    })();
  } else if (!process.env.VERCEL) {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

export default app;

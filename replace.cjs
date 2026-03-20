const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/App.tsx',
  'src/components/AdminLogin.tsx',
  'src/components/SchoolRegistration.tsx',
  'src/services/securityService.ts'
];

const replacements = [
  { from: /checky_schools/g, to: 'checky_places' },
  { from: /checky_students/g, to: 'checky_members' },
  { from: /school_id/g, to: 'place_id' },
  { from: /student_id/g, to: 'member_code' },
  { from: /school_name/g, to: 'name' },
  { from: /representative_phone/g, to: 'contact_phone' },
  { from: /parent_contact/g, to: 'contact_number' },
  { from: /checky_admin_school_info/g, to: 'checky_admin_place_info' },
  { from: /checky_kiosk_school_info/g, to: 'checky_kiosk_place_info' },
  { from: /schoolId/g, to: 'placeId' },
  { from: /studentId/g, to: 'memberCode' },
  { from: /schoolInfo/g, to: 'placeInfo' },
  { from: /studentData/g, to: 'memberData' },
  { from: /studentError/g, to: 'memberError' },
  { from: /studentSubs/g, to: 'memberSubs' },
  { from: /studentLabel/g, to: 'memberLabel' },
  { from: /student/g, to: 'member' },
  { from: /Student/g, to: 'Member' },
  { from: /school/g, to: 'place' },
  { from: /School/g, to: 'Place' }
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // We need to be careful with case-insensitive or exact matches.
    // Let's do exact string replacements first to avoid messing up imports or standard words if possible.
    // Actually, regex is fine if we are careful.
    
    // Let's do exact replacements for DB columns and table names first
    content = content.replace(/checky_schools/g, 'checky_places');
    content = content.replace(/checky_students/g, 'checky_members');
    content = content.replace(/school_id/g, 'place_id');
    content = content.replace(/student_id/g, 'member_code');
    content = content.replace(/school_name/g, 'name');
    content = content.replace(/representative_phone/g, 'contact_phone');
    content = content.replace(/parent_contact/g, 'contact_number');
    
    // Local storage keys
    content = content.replace(/checky_admin_school_info/g, 'checky_admin_place_info');
    content = content.replace(/checky_kiosk_school_info/g, 'checky_kiosk_place_info');
    
    // Variables
    content = content.replace(/schoolId/g, 'placeId');
    content = content.replace(/studentId/g, 'memberCode');
    content = content.replace(/schoolInfo/g, 'placeInfo');
    content = content.replace(/studentData/g, 'memberData');
    content = content.replace(/studentError/g, 'memberError');
    content = content.replace(/studentSubs/g, 'memberSubs');
    content = content.replace(/studentLabel/g, 'memberLabel');
    
    // UI text replacements
    // "학원" -> "장소", "학생" -> "멤버" (handled mostly by the mode logic, but let's be careful)
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});

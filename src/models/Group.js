/**
 * Group Model (v7 Schema)
 * 
 * v7 Changes:
 * - Added: adminIds, createdBy, pollIds[], projectIds[], privateThreadIds[], settings{}
 */

export const createGroup = (groupData) => {
  return {
    // Identity
    groupId: groupData.groupId,
    groupType: groupData.groupType || 'family', // MVP: only "family", V2: "soccer_team", "school", etc.
    groupName: groupData.groupName,
    groupDescription: groupData.groupDescription || '',
    groupPhotoUrl: groupData.groupPhotoUrl || null,

    // v7: Member management (supports admin roles)
    memberIds: groupData.memberIds || [],
    adminIds: groupData.adminIds || [groupData.createdBy], // Creator is admin by default
    createdBy: groupData.createdBy,

    // v7: Future entity references (empty in MVP, populated in V2)
    pollIds: [],
    projectIds: [],
    privateThreadIds: [],

    // v7: Settings with defaults (enables feature flags)
    settings: {
      allowMemberInvites: true,
      requireApprovalForJoin: false,
      allowPolls: false, // MVP: false, V2: enable
      allowPrivateThreads: false, // MVP: false, V2: enable
      allowTaskAssignment: true, // MVP: true (basic)
      allowProjectManagement: false, // MVP: false, V2: enable
      messageDeletionPolicy: 'sender_only', // "sender_only" | "admin_only" | "anyone"
      taskVisibility: 'all', // "all" | "assigned_only"
      ...groupData.settings,
    },

    // Invite tracking
    inviteCode: groupData.inviteCode || generateInviteCode(),
    inviteLink: `https://mccarthy.app/join/${groupData.inviteCode || generateInviteCode()}`,

    // Metadata
    createdAt: groupData.createdAt || new Date().toISOString(),
    updatedAt: groupData.updatedAt || new Date().toISOString(),
    memberCount: groupData.memberIds?.length || 0,
    messageCount: 0,
    lastActivity: groupData.lastActivity || new Date().toISOString(),
  };
};

function generateInviteCode() {
  // Generate simple invite code (e.g., "HUTCH2025")
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomChars = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const year = new Date().getFullYear();
  return `${randomChars}${year}`;
}

export const updateGroup = (existingGroup, updates) => {
  return {
    ...existingGroup,
    ...updates,
    updatedAt: new Date().toISOString(),
    // Recalculate member count if memberIds changed
    memberCount: updates.memberIds ? updates.memberIds.length : existingGroup.memberCount,
  };
};


/**
 * 判断指定角色是否未激活/待审核
 * @param {import('../types/User').User} user
 * @param {string} role
 * @returns {boolean}
 */
export function isRoleInactive(user, role) {
  if (!user || !user.roles) return false;
  // 用户全局状态
  if (user.status && user.status !== 'active') return true;
  // 志愿者/专家 profile 审核状态
  if (role === 'volunteer' && user.volunteer_profile && user.volunteer_profile.status && user.volunteer_profile.status !== 'approved') return true;
  if (role === 'expert' && user.expert_profile && user.expert_profile.status && user.expert_profile.status !== 'approved') return true;
  return false;
}

/**
 * @typedef {Object} VolunteerProfile
 * @property {number} user_id 用户ID (外键)
 * @property {string} [full_name] 真实姓名 (仅管理员可见)
 * @property {string} [phone] 手机号 (仅管理员可见)
 * @property {string} [public_email] 公开邮箱
 * @property {boolean} [is_public_visible] 是否在志愿者墙展示
 * @property {number} [service_hours] 累计服务时长
 * @property {string[]} [skills] 擅长领域
 * @property {string} [status] 注册审核状态 'pending'|'approved'|'rejected'
 * @property {string} [work_status] 服务状态 'online'|'busy'|'offline'
 */

/**
 * @typedef {Object} ExpertProfile
 * @property {number} user_id 用户ID (外键)
 * @property {string} [full_name] 真实姓名
 * @property {string} [title] 职称
 * @property {string} [organization] 所属机构
 * @property {string[]} [qualifications] 资质证书URL
 * @property {string[]} [specialties] 擅长领域标签
 * @property {string} [phone] 手机号 (仅管理员可见)
 * @property {string} [public_email] 公开邮箱
 * @property {boolean} [is_public_visible] 是否在专家墙展示
 * @property {string} [status] 注册审核状态 'pending'|'approved'|'rejected'
 */

/**
 * @typedef {Object} User
 * @property {number} id 用户唯一标识
 * @property {string} username 用户名
 * @property {string} [gender] 性别 'male'|'female'|'hidden'
 * @property {string} [email] 邮箱
 * @property {string} [nickname] 昵称
 * @property {string} [avatar] 头像URL
 * @property {string[]} roles 角色列表 ['family', 'volunteer', 'expert', 'admin', 'maintainer']
 * @property {string} [status] 状态 'active'|'banned'|'pending_review'
 * @property {string} [created_at] 创建时间
 * @property {VolunteerProfile} [volunteer_profile] 志愿者扩展信息
 * @property {ExpertProfile} [expert_profile] 专家扩展信息
 * @property {Object.<string, any>} [other_profiles] 未来扩展角色的 profile 字段，如 xxx_profile
 * @property {UserProfileBase} [profile] 通用基础信息
 */

// 示例导出（如需 TypeScript 可用 export type User = {...}）
// 这里采用 JSDoc 以便 JS/TS/多端通用



// 根据 OpenAPI UserOut/UserUpdate schema 生成的类型定义
// 前端独有字段已注明

export interface VolunteerProfile {
  user_id: number;
  full_name?: string;
  phone?: string;
  public_email?: string;
  is_public_visible?: boolean;
  service_hours?: number;
  skills?: string[];
  status?: 'pending' | 'approved' | 'rejected';
  work_status?: 'online' | 'busy' | 'offline';
}

export interface ExpertProfile {
  user_id: number;
  full_name?: string;
  title?: string;
  organization?: string;
  qualifications?: string[]; // 前端独有/文档缺失
  specialties?: string[];
  phone?: string;
  public_email?: string;
  is_public_visible?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface User {
  id: number;
  username: string;
  gender?: 'male' | 'female' | 'hidden';
  email?: string;
  nickname?: string;
  avatar?: string;
  roles: Array<'family' | 'volunteer' | 'expert' | 'admin' | 'maintainer'>;
  status?: 'active' | 'banned' | 'pending_review';
  created_at?: string;
  volunteer_profile?: VolunteerProfile;
  expert_profile?: ExpertProfile;
  other_profiles?: Record<string, any>;
  profile?: UserProfileBase;
  bio?: string; // 前端独有/文档缺失
}

export interface UserUpdate {
  nickname?: string;
  gender?: 'male' | 'female' | 'hidden';
  avatar?: string;
  // 其它可更新字段按 OpenAPI UserUpdate schema 增补
  bio?: string; // 前端独有/文档缺失
}

export interface UserProfileBase {
  // 按 openapi.json UserOut/UserUpdate profile 字段定义
  // 如无则可省略
}

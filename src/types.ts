export type ModuleId =
  | 'overview'
  | 'campusfix'
  | 'exchange'
  | 'classroom'
  | 'mentor'
  | 'connect'
  | 'vault'
  | 'mobility'
  | 'lostfound'
  | 'opportunities'
  | 'workspace'
  | 'profile'
  | 'admin';

export type UserRole = 'student' | 'faculty' | 'admin';

export interface CampusUser {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  department: string;
  year: string;
  campusId: string;
  bio: string;
  avatarUrl?: string;
  isDemo?: boolean;
}

export interface ComplaintItem {
  id: string;
  title: string;
  description: string;
  category: 'electrical' | 'hvac' | 'network' | 'plumbing' | 'safety' | 'av_equipment';
  building: string;
  room?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved';
  authorId: string;
  authorName: string;
  assignedTeam?: string;
  aiSuggestion?: string;
  evidencePreviewUrl?: string;
  resolutionNotes?: string;
  upvotes: number;
  createdAtLabel: string;
  source?: 'firestore' | 'seed';
}

export interface MarketplaceListing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: 'electronics' | 'books' | 'lab_gear' | 'furniture' | 'cycles';
  condition: 'like_new' | 'good' | 'fair';
  status: 'available' | 'reserved' | 'sold';
  sellerId: string;
  sellerName: string;
  imageUrl?: string;
  createdAtLabel: string;
  source?: 'firestore' | 'seed';
}

export interface ClassroomNode {
  id: string;
  code: string;
  building: string;
  floor: string;
  capacity: number;
  occupancy: number;
  temperatureC: number;
  targetTempC: number;
  co2Ppm: number;
  lightingPct: number;
  projectorOn: boolean;
  ecoMode: boolean;
  status: 'occupied' | 'available' | 'maintenance';
  currentClass: string;
  nextSlot: string;
}

export interface CampusNotice {
  id: string;
  title: string;
  body: string;
  noticeType: 'circular' | 'event' | 'academic' | 'maintenance';
  location?: string;
  eventDate?: string;
  organizerId: string;
  organizerName: string;
  rsvpCount: number;
  imageUrl?: string;
  createdAtLabel: string;
  source?: 'firestore' | 'seed';
}

export interface VaultResource {
  id: string;
  title: string;
  courseCode: string;
  resourceType: 'notes' | 'pyq' | 'book' | 'lab_manual';
  semester: string;
  description: string;
  uploaderId: string;
  uploaderName: string;
  downloads: number;
  pagesCount: number;
  previewSections: { heading: string; body: string }[];
  source?: 'firestore' | 'seed';
}

export interface LostFoundItem {
  id: string;
  title: string;
  description: string;
  itemType: 'lost' | 'found';
  location: string;
  category: 'electronics' | 'id_card' | 'accessories' | 'books' | 'keys';
  status: 'open' | 'matched' | 'claimed';
  reporterId: string;
  reporterName: string;
  imageUrl?: string;
  matchConfidence?: number;
  matchedItemTitle?: string;
  createdAtLabel: string;
  source?: 'firestore' | 'seed';
}

export interface OpportunityItem {
  id: string;
  title: string;
  organization: string;
  oppType: 'hackathon' | 'internship' | 'volunteering' | 'research';
  deadline: string;
  reward: string;
  description: string;
  creatorId: string;
  applicantCount: number;
  imageUrl?: string;
  source?: 'firestore' | 'seed';
}

export interface WorkspaceNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  courseCode: string;
  updatedAtLabel: string;
  source?: 'firestore' | 'local';
}

export interface SavedMentorResponse {
  id: string;
  userId: string;
  title: string;
  summary: string;
  topic: string;
  createdAtLabel: string;
  source?: 'firestore' | 'local';
}

export interface ActivityEvent {
  id: string;
  timeLabel: string;
  title: string;
  detail: string;
  module: ModuleId;
  tone: 'rose' | 'green' | 'amber' | 'charcoal';
}

export interface AppNotification {
  id: string;
  title: string;
  detail: string;
  module: ModuleId;
  severity: 'critical' | 'info' | 'success';
  timeLabel: string;
  read: boolean;
}

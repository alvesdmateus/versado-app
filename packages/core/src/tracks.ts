export type TrackId = "cka" | "aws-saa" | "devops" | "custom";

export interface TrackExamConfig {
  enabled: boolean;
  questionCount: number;
  timeLimitMinutes: number;
  passingScore: number;
}

export interface TrackConfig {
  id: TrackId;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  tagFilter: string[];
  examMode: TrackExamConfig;
  freeCardLimit: number;
  freeExamSimulations: number;
  hideNavItems: string[];
}

export const TRACKS: Record<TrackId, TrackConfig> = {
  cka: {
    id: "cka",
    name: "Pass the CKA Exam",
    shortName: "CKA",
    description: "Certified Kubernetes Administrator",
    icon: "Shield",
    tagFilter: ["cka"],
    examMode: {
      enabled: true,
      questionCount: 25,
      timeLimitMinutes: 120,
      passingScore: 66,
    },
    freeCardLimit: 25,
    freeExamSimulations: 1,
    hideNavItems: ["discover", "community"],
  },
  "aws-saa": {
    id: "aws-saa",
    name: "Pass the AWS SAA Exam",
    shortName: "AWS SAA",
    description: "AWS Solutions Architect – Associate",
    icon: "Cloud",
    tagFilter: ["aws-saa"],
    examMode: {
      enabled: true,
      questionCount: 30,
      timeLimitMinutes: 65,
      passingScore: 72,
    },
    freeCardLimit: 25,
    freeExamSimulations: 1,
    hideNavItems: ["discover", "community"],
  },
  devops: {
    id: "devops",
    name: "Learn DevOps",
    shortName: "DevOps",
    description: "Master DevOps practices and tools",
    icon: "Terminal",
    tagFilter: ["devops"],
    examMode: {
      enabled: false,
      questionCount: 50,
      timeLimitMinutes: 60,
      passingScore: 70,
    },
    freeCardLimit: 30,
    freeExamSimulations: 0,
    hideNavItems: ["discover", "community"],
  },
  custom: {
    id: "custom",
    name: "Create Your Own Flashcards",
    shortName: "Custom",
    description: "Use Versado as a general flashcard tool",
    icon: "Layers",
    tagFilter: [],
    examMode: {
      enabled: false,
      questionCount: 20,
      timeLimitMinutes: 30,
      passingScore: 70,
    },
    freeCardLimit: Infinity,
    freeExamSimulations: 0,
    hideNavItems: [],
  },
};

export function getTrack(id: TrackId): TrackConfig {
  return TRACKS[id];
}

export function isValidTrackId(id: string): id is TrackId {
  return id in TRACKS;
}

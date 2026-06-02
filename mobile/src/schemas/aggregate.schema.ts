import { z } from 'zod';

export const StudentProgressSchema = z.object({
  totalVideos: z.number().int(),
  completedVideos: z.number().int(),
  inProgressVideos: z.number().int(),
  notStartedVideos: z.number().int(),
  watchedSeconds: z.coerce.number().int(),
  totalSeconds: z.coerce.number().int(),
  completionPercent: z.coerce.number(),
});

// GET /aggregates/teacher
export const TeacherStudentSchema = z.object({
  id: z.number().int(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string(),
  progress: StudentProgressSchema,
});

export const TeacherClassroomSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  level: z.string().nullable().optional(),
  students: z.array(TeacherStudentSchema),
});

export const TeacherSubjectSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  totalVideos: z.number().int(),
  totalSeconds: z.coerce.number().int(),
  classrooms: z.array(TeacherClassroomSchema),
});

export const TeacherAggregateSchema = z.array(TeacherSubjectSchema);

export type TeacherSubjectAggregate = z.infer<typeof TeacherSubjectSchema>;
export type TeacherStudent = z.infer<typeof TeacherStudentSchema>;

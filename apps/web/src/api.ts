import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Course, Role, CourseReview, CourseAnnouncement, LessonResource, InteractiveNote, LessonDiscussion } from "@fs03/shared";

export type User = { id: string; name: string; email: string; role: Role };
export type Media = { id: string; status: string; progress: number; metadata?: { durationSeconds?: number }; failureReason?: string };
export type LessonView = { id: string; title: string; summary?: string; content?: string; type?: "video" | "article" | "exercise"; videoUrl?: string; durationSeconds: number; preview: boolean; mediaAssetId?: string; mediaStatus?: string; resources?: LessonResource[]; progress?: { positionSeconds: number; completedAt?: string } };
export type LearningData = { course: Omit<Course, "sections"> & { sections: Array<{ id: string; title: string; lessons: LessonView[] }> }; completion: { completed: boolean; completedLessons: number; totalLessons: number; quizComplete: boolean } };

const rawBaseQuery = fetchBaseQuery({ baseUrl: "/api/v1", credentials: "include" });
const baseQuery: typeof rawBaseQuery = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401 && args !== "/auth/refresh") {
    const refreshed = await rawBaseQuery({ url: "/auth/refresh", method: "POST" }, api, extraOptions);
    if (!refreshed.error) result = await rawBaseQuery(args, api, extraOptions);
  }
  return result;
};

export const lmsApi = createApi({
  reducerPath: "lmsApi",
  baseQuery,
  tagTypes: ["User", "Courses", "Course", "Enrollments", "Learning", "Earnings", "Media", "Quiz", "LiveClasses", "LiveChat", "Certificates", "Reviews", "Announcements", "Notes", "Resources", "Learners", "Discussions", "Bookmarks"],
  endpoints: (builder) => ({
    me: builder.query<{ user: User }, void>({ query: () => "/auth/me", providesTags: ["User"] }),
    login: builder.mutation<{ user: User }, { email: string; password: string }>({ query: (body) => ({ url: "/auth/login", method: "POST", body }), invalidatesTags: ["User"] }),
    register: builder.mutation<{ user: User }, { name: string; email: string; password: string }>({ query: (body) => ({ url: "/auth/register", method: "POST", body }), invalidatesTags: ["User"] }),
    logout: builder.mutation<void, void>({ query: () => ({ url: "/auth/logout", method: "POST" }), invalidatesTags: ["User"] }),
    courses: builder.query<{ courses: Array<Course & { enrollmentCount: number }>; total: number; pages: number }, { q?: string; category?: string; page?: number; limit?: number }>({ query: (params) => ({ url: "/courses", params }), providesTags: ["Courses"] }),
    course: builder.query<{ course: Course; enrollmentCount: number; quiz?: { title: string; passPercent: number; required: boolean } }, string>({ query: (courseId) => `/courses/${courseId}`, providesTags: (_result, _error, id) => [{ type: "Course", id }] }),
    instructorCourses: builder.query<{ courses: Course[] }, void>({ query: () => "/instructor/courses", providesTags: ["Courses"] }),
    createCourse: builder.mutation<{ course: Course }, Partial<Course>>({ query: (body) => ({ url: "/instructor/courses", method: "POST", body }), invalidatesTags: ["Courses"] }),
    updateCourse: builder.mutation<{ course: Course }, { id: string; body: Partial<Course> }>({ query: ({ id, body }) => ({ url: `/instructor/courses/${id}`, method: "PATCH", body }), invalidatesTags: ["Courses", "Course"] }),
    addLesson: builder.mutation<{ sections: Course["sections"] }, { courseId: string; title: string; summary?: string; durationSeconds: number; preview: boolean; newSectionTitle?: string }>({ query: ({ courseId, ...body }) => ({ url: `/instructor/courses/${courseId}/lessons`, method: "POST", body }), invalidatesTags: ["Courses", "Course"] }),
    publishCourse: builder.mutation<{ course: Course; message: string }, { courseId: string; publishImmediately?: boolean }>({ query: ({ courseId, ...body }) => ({ url: `/instructor/courses/${courseId}/publish`, method: "POST", body }), invalidatesTags: ["Courses", "Course"] }),
    uploadVideo: builder.mutation<{ media: Media; queue: string }, { lessonId: string; file: File }>({ query: ({ lessonId, file }) => { const body = new FormData(); body.append("video", file); return { url: `/instructor/lessons/${lessonId}/media`, method: "POST", body }; }, invalidatesTags: ["Courses", "Learning"] }),
    media: builder.query<{ media: Media }, string>({ query: (mediaId) => `/media/${mediaId}`, providesTags: (_result, _error, id) => [{ type: "Media", id }] }),
    enroll: builder.mutation<{ enrollment: unknown }, string>({ query: (courseId) => ({ url: `/courses/${courseId}/enroll`, method: "POST" }), invalidatesTags: ["Enrollments", "Courses", "Course"] }),
    enrollments: builder.query<{ enrollments: Array<{ course: Course; progress: { completed: number; total: number } }> }, void>({ query: () => "/me/enrollments", providesTags: ["Enrollments"] }),
    learning: builder.query<LearningData, string>({ query: (courseId) => `/courses/${courseId}/learning`, providesTags: (_result, _error, id) => [{ type: "Learning", id }] }),
    progress: builder.mutation<{ progress: { positionSeconds: number; completedAt?: string } }, { lessonId: string; courseId: string; positionSeconds: number; playing: boolean }>({ query: ({ lessonId, ...body }) => ({ url: `/lessons/${lessonId}/progress`, method: "POST", body }), invalidatesTags: (_result, _error, arg) => [{ type: "Learning", id: arg.courseId }, "Enrollments"] }),
    completeLesson: builder.mutation<{ progress: unknown; completed?: boolean }, { courseId: string; lessonId: string; completed?: boolean }>({ query: ({ courseId, lessonId, completed }) => ({ url: `/lessons/${lessonId}/complete`, method: "POST", body: { courseId, completed } }), invalidatesTags: (_result, _error, arg) => [{ type: "Learning", id: arg.courseId }, "Enrollments"] }),
    quiz: builder.query<{ quiz: { id: string; title: string; passPercent: number; required: boolean; questions: Array<{ id: string; prompt: string; options: string[] }> }; attempts: Array<{ scorePercent: number; passed: boolean }> }, string>({ query: (courseId) => `/courses/${courseId}/quiz`, providesTags: ["Quiz"] }),
    submitQuiz: builder.mutation<{ attempt: { scorePercent: number; passed: boolean; correctCount: number; total: number; answerResults: Array<{ questionId: string; correct: boolean; correctOptionIndex: number }> } }, { courseId: string; answers: Record<string, number> }>({ query: ({ courseId, ...body }) => ({ url: `/courses/${courseId}/quiz/attempts`, method: "POST", body }), invalidatesTags: (_result, _error, arg) => [{ type: "Learning", id: arg.courseId }, "Quiz"] }),
    earnings: builder.query<{ grossMinor: number; platformFeeMinor: number; instructorNetMinor: number; pendingPayoutMinor: number; settledMinor: number; transactions: Array<{ paymentId: string; courseTitle?: string; amountMinor: number; currency: string; status: string; date: string; instructorNetMinor: number }> }, void>({ query: () => "/instructor/earnings", providesTags: ["Earnings"] }),
    checkout: builder.mutation<{ payment?: { id: string }; mock?: boolean; checkoutUrl?: string; message?: string }, string>({ query: (courseId) => ({ url: `/courses/${courseId}/checkout`, method: "POST" }), invalidatesTags: ["Enrollments"] }),
    mockConfirm: builder.mutation<{ payment: { status: string } }, string>({ query: (paymentId) => ({ url: `/payments/${paymentId}/mock-confirm`, method: "POST" }), invalidatesTags: ["Enrollments", "Earnings", "Courses"] }),
    liveClasses: builder.query<{ sessions: Array<{ id: string; title: string; startsAt: string; endsAt: string; status: string }>; providerConfigured: boolean }, string>({ query: (courseId) => `/courses/${courseId}/live-classes`, providesTags: ["LiveClasses"] }),
    createLiveClass: builder.mutation<{ session: { id: string; title: string }; providerConfigured: boolean }, { courseId: string; body: { title: string; startsAt: string; durationMinutes: number; description?: string } }>({ query: ({ courseId, body }) => ({ url: `/instructor/courses/${courseId}/live-classes`, method: "POST", body }), invalidatesTags: ["LiveClasses"] }),
    joinLiveClass: builder.mutation<{ url: string; token: string; provider?: "livekit" | "local-webrtc"; session: { id: string; title: string; roomName: string; instructorId?: string } }, string>({ query: (sessionId) => ({ url: `/live-classes/${sessionId}/join`, method: "POST" }) }),
    endLiveClass: builder.mutation<{ session: unknown }, string>({ query: (sessionId) => ({ url: `/live-classes/${sessionId}/end`, method: "POST" }), invalidatesTags: ["LiveClasses"] }),
    liveClassMessages: builder.query<{ messages: Array<{ id: string; sessionId: string; senderId: string; senderName: string; senderRole: string; text: string; createdAt: string }> }, string>({ query: (sessionId) => `/live-classes/${sessionId}/messages`, providesTags: ["LiveChat"] }),
    sendLiveClassMessage: builder.mutation<{ message: unknown }, { sessionId: string; text: string }>({ query: ({ sessionId, ...body }) => ({ url: `/live-classes/${sessionId}/messages`, method: "POST", body }), invalidatesTags: ["LiveChat"] }),
    certificates: builder.query<{ certificates: Array<{ id: string; certificateNumber: string; courseTitle: string; issuedAt: string }> }, void>({ query: () => "/me/certificates", providesTags: ["Certificates"] }),
    issueCertificate: builder.mutation<{ certificate: { id: string; certificateNumber: string } }, string>({ query: (courseId) => ({ url: `/courses/${courseId}/certificate`, method: "POST" }), invalidatesTags: ["Certificates"] }),
    adminOverview: builder.query<Record<string, number | { processing: number; failed: number }>, void>({ query: () => "/admin/overview" }),
    adminReviewQueue: builder.query<{ courses: Course[] }, void>({ query: () => "/admin/courses/review-queue", providesTags: ["Courses"] }),
    reviewCourse: builder.mutation<{ course: Course }, { courseId: string; decision: "approve" | "reject"; note?: string }>({ query: ({ courseId, ...body }) => ({ url: `/admin/courses/${courseId}/review`, method: "POST", body }), invalidatesTags: ["Courses", "Course"] }),
    instructorAnalytics: builder.query<{ totalCourses: number; publishedCourses: number; totalEnrollments: number; activeLearners: number; completedLessons: number; liveClassParticipants: number; courses: Array<{ courseId: string; title: string; status: string; enrollments: number; completionRatePercent: number; quizAttempts: number; quizPassRatePercent: number }> }, void>({ query: () => "/instructor/analytics", providesTags: ["Courses", "Enrollments"] }),
    instructorQuiz: builder.query<{ quiz?: { id: string; title: string; passPercent: number; required: boolean; questions: Array<{ id: string; prompt: string; options: string[]; correctOptionIndex: number }> } }, string>({ query: (courseId) => `/instructor/courses/${courseId}/quiz`, providesTags: (_result, _error, id) => [{ type: "Quiz", id }] }),
    saveInstructorQuiz: builder.mutation<{ quiz: { id: string } }, { courseId: string; body: { title: string; passPercent: number; required: boolean; questions: Array<{ prompt: string; options: string[]; correctOptionIndex: number }> } }>({ query: ({ courseId, body }) => ({ url: `/instructor/courses/${courseId}/quiz`, method: "POST", body }), invalidatesTags: (_result, _error, arg) => [{ type: "Quiz", id: arg.courseId }, "Learning"] }),
    instructorApplication: builder.query<{ application?: { id: string; status: string; reviewNote?: string } }, void>({ query: () => "/instructor/applications/me", providesTags: ["User"] }),
    applyAsInstructor: builder.mutation<{ application: { id: string; status: string } }, { bio: string; specialties: string[] }>({ query: (body) => ({ url: "/instructor/applications", method: "POST", body }), invalidatesTags: ["User"] }),
    instructorApplications: builder.query<{ applications: Array<{ id: string; bio: string; specialties: string[]; applicant?: { name: string; email: string } }> }, void>({ query: () => "/admin/instructor-applications" }),
    reviewInstructorApplication: builder.mutation<{ userRole: string }, { applicationId: string; decision: "approve" | "reject"; note?: string }>({ query: ({ applicationId, ...body }) => ({ url: `/admin/instructor-applications/${applicationId}/review`, method: "POST", body }), invalidatesTags: ["User"] }),
    // Enterprise Reviews & Ratings
    reviews: builder.query<{ reviews: CourseReview[]; stats: { averageRating: number; totalReviews: number; distribution: Record<number, number> } }, string>({ query: (courseId) => `/courses/${courseId}/reviews`, providesTags: (_result, _error, id) => [{ type: "Reviews", id }] }),
    addReview: builder.mutation<{ review: CourseReview }, { courseId: string; rating: number; comment: string }>({ query: ({ courseId, ...body }) => ({ url: `/courses/${courseId}/reviews`, method: "POST", body }), invalidatesTags: (_result, _error, arg) => [{ type: "Reviews", id: arg.courseId }, { type: "Course", id: arg.courseId }, "Courses"] }),
    // Course Announcements
    announcements: builder.query<{ announcements: CourseAnnouncement[] }, string>({ query: (courseId) => `/courses/${courseId}/announcements`, providesTags: (_result, _error, id) => [{ type: "Announcements", id }] }),
    addAnnouncement: builder.mutation<{ announcement: CourseAnnouncement }, { courseId: string; title: string; content: string }>({ query: ({ courseId, ...body }) => ({ url: `/instructor/courses/${courseId}/announcements`, method: "POST", body }), invalidatesTags: (_result, _error, arg) => [{ type: "Announcements", id: arg.courseId }] }),
    // Lesson Interactive Notes
    lessonNotes: builder.query<{ notes: InteractiveNote[] }, { courseId: string; lessonId: string }>({ query: ({ courseId, lessonId }) => `/courses/${courseId}/lessons/${lessonId}/notes`, providesTags: ["Notes"] }),
    addNote: builder.mutation<{ note: InteractiveNote }, { courseId: string; lessonId: string; timestampSeconds: number; text: string }>({ query: ({ courseId, lessonId, ...body }) => ({ url: `/courses/${courseId}/lessons/${lessonId}/notes`, method: "POST", body }), invalidatesTags: ["Notes"] }),
    deleteNote: builder.mutation<{ success: boolean }, string>({ query: (noteId) => ({ url: `/notes/${noteId}`, method: "DELETE" }), invalidatesTags: ["Notes"] }),
    // Downloadable Lesson Resources
    addLessonResource: builder.mutation<{ resource: LessonResource; resources: LessonResource[] }, { courseId: string; lessonId: string; title: string; url: string; type: "pdf" | "link" | "code" | "document" | "archive"; sizeLabel?: string }>({ query: ({ courseId, lessonId, ...body }) => ({ url: `/instructor/courses/${courseId}/lessons/${lessonId}/resources`, method: "POST", body }), invalidatesTags: ["Courses", "Course", "Learning"] }),
    deleteLessonResource: builder.mutation<{ success: boolean; resources: LessonResource[] }, { courseId: string; lessonId: string; resourceId: string }>({ query: ({ courseId, lessonId, resourceId }) => ({ url: `/instructor/courses/${courseId}/lessons/${lessonId}/resources/${resourceId}`, method: "DELETE" }), invalidatesTags: ["Courses", "Course", "Learning"] }),
    // Instructor Learner Analytics
    instructorLearners: builder.query<{ learners: Array<{ enrollment: unknown; student?: { name: string; email: string }; completedLessons: number; totalLessons: number; progressPercent: number; quizPassed: boolean; quizScore?: number; certificateNumber?: string }> }, string>({ query: (courseId) => `/instructor/courses/${courseId}/learners`, providesTags: ["Learners"] }),
    // Lesson Discussions & Q&A
    lessonDiscussions: builder.query<{ discussions: LessonDiscussion[] }, { courseId: string; lessonId: string }>({ query: ({ courseId, lessonId }) => `/courses/${courseId}/lessons/${lessonId}/discussions`, providesTags: ["Discussions"] }),
    addLessonDiscussion: builder.mutation<{ discussion: LessonDiscussion }, { courseId: string; lessonId: string; question: string }>({ query: ({ courseId, lessonId, ...body }) => ({ url: `/courses/${courseId}/lessons/${lessonId}/discussions`, method: "POST", body }), invalidatesTags: ["Discussions"] }),
    // Lesson Bookmarks
    bookmarks: builder.query<{ bookmarkedLessonIds: string[] }, string>({ query: (courseId) => `/courses/${courseId}/bookmarks`, providesTags: ["Bookmarks"] }),
    toggleBookmark: builder.mutation<{ bookmarked: boolean; lessonId: string }, { courseId: string; lessonId: string }>({ query: ({ courseId, ...body }) => ({ url: `/courses/${courseId}/bookmarks`, method: "POST", body }), invalidatesTags: ["Bookmarks"] }),
  }),
});

export const {
  useMeQuery, useLoginMutation, useRegisterMutation, useLogoutMutation, useCoursesQuery, useCourseQuery, useInstructorCoursesQuery,
  useCreateCourseMutation, useUpdateCourseMutation, useAddLessonMutation, usePublishCourseMutation, useUploadVideoMutation,
  useMediaQuery, useEnrollMutation, useEnrollmentsQuery, useLearningQuery, useProgressMutation, useCompleteLessonMutation, useQuizQuery, useSubmitQuizMutation,
  useEarningsQuery, useCheckoutMutation, useMockConfirmMutation, useLiveClassesQuery, useCreateLiveClassMutation, useJoinLiveClassMutation,
  useEndLiveClassMutation, useLiveClassMessagesQuery, useSendLiveClassMessageMutation,
  useCertificatesQuery, useIssueCertificateMutation, useAdminOverviewQuery,
  useAdminReviewQueueQuery, useReviewCourseMutation, useInstructorAnalyticsQuery, useInstructorQuizQuery, useSaveInstructorQuizMutation,
  useInstructorApplicationQuery, useApplyAsInstructorMutation, useInstructorApplicationsQuery, useReviewInstructorApplicationMutation,
  useReviewsQuery, useAddReviewMutation, useAnnouncementsQuery, useAddAnnouncementMutation,
  useLessonNotesQuery, useAddNoteMutation, useDeleteNoteMutation,
  useAddLessonResourceMutation, useDeleteLessonResourceMutation, useInstructorLearnersQuery,
  useLessonDiscussionsQuery, useAddLessonDiscussionMutation, useBookmarksQuery, useToggleBookmarkMutation,
} = lmsApi;

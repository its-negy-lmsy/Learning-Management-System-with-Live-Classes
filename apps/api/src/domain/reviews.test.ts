import { describe, expect, it } from "vitest";
import { calculateReviewStats } from "../routes/courses.js";
import type { CourseReview } from "@fs03/shared";

describe("reviews domain statistics", () => {
  it("returns zero stats when there are no reviews", () => {
    const stats = calculateReviewStats([]);
    expect(stats).toEqual({
      averageRating: 0,
      totalReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
  });

  it("accurately averages ratings and calculates rating distribution", () => {
    const sampleReviews: CourseReview[] = [
      { id: "1", courseId: "c1", studentId: "s1", studentName: "A", rating: 5, comment: "Excellent", createdAt: "2026-10-31", updatedAt: "2026-10-31" },
      { id: "2", courseId: "c1", studentId: "s2", studentName: "B", rating: 4, comment: "Very good", createdAt: "2026-10-31", updatedAt: "2026-10-31" },
      { id: "3", courseId: "c1", studentId: "s3", studentName: "C", rating: 5, comment: "Top tier", createdAt: "2026-10-31", updatedAt: "2026-10-31" },
    ];
    const stats = calculateReviewStats(sampleReviews);
    expect(stats.totalReviews).toBe(3);
    // (5 + 4 + 5) / 3 = 14 / 3 = 4.666 -> rounded to 4.7
    expect(stats.averageRating).toBe(4.7);
    expect(stats.distribution[5]).toBe(2);
    expect(stats.distribution[4]).toBe(1);
    expect(stats.distribution[1]).toBe(0);
  });
});

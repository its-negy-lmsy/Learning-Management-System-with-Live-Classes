import { useState } from "react";
import { Search } from "lucide-react";
import { useCoursesQuery } from "../api";
import { CourseGrid } from "../components/courses/CourseCard";
import { ErrorPanel } from "../components/common/UIComponents";

export function ExplorePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All topics");
  const { data, isLoading, isError } = useCoursesQuery({
    q: query || undefined,
    category: category === "All topics" ? undefined : category,
  });
  const topics = [
    "All topics",
    "Design",
    "Development",
    "Data",
    "Business",
    "Marketing",
    "Photography",
  ];

  return (
    <section className="catalog wrap">
      <div className="catalog-intro">
        <div className="eyebrow">
          <span className="eyebrow-line" /> A shelf full of possibilities
        </div>
        <h1>
          Find your next
          <br />
          <em>good thing.</em>
        </h1>
        <p>
          Pick up a new skill, give an old idea a fresh start, or follow the question that keeps
          coming back.
        </p>
        <div className="catalog-search">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try “design systems” or “analytics”"
          />
          <span>↵</span>
        </div>
      </div>
      <div className="catalog-content">
        <div className="topic-row">
          {topics.map((topic) => (
            <button
              className={category === topic ? "topic active" : "topic"}
              key={topic}
              onClick={() => setCategory(topic)}
            >
              {topic}
            </button>
          ))}
        </div>
        {isError ? (
          <ErrorPanel message="Courses couldn't load. Check that the API is running and try again." />
        ) : (
          <CourseGrid courses={data?.courses ?? []} loading={isLoading} />
        )}
      </div>
    </section>
  );
}

import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowUpDown, Filter, Search, X } from "lucide-react";
import { useCoursesQuery } from "../api";
import { CourseGrid } from "../components/courses/CourseCard";
import { ErrorPanel } from "../components/common/UIComponents";

const topics = [
  "All topics",
  "Development",
  "Data",
  "Design",
  "Cloud",
  "Business",
  "Marketing",
  "Photography",
];

const levels = ["All Levels", "Beginner Friendly", "Intermediate"];
const priceOptions = ["All Prices", "Free to Learn", "Paid Courses"];

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "All topics";

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [selectedLevel, setSelectedLevel] = useState("All Levels");
  const [selectedPrice, setSelectedPrice] = useState("All Prices");
  const [sortBy, setSortBy] = useState<"featured" | "rating" | "popular" | "price-asc" | "price-desc">("featured");

  const { data, isLoading, isError } = useCoursesQuery({
    q: query || undefined,
    category: category === "All topics" ? undefined : category,
    limit: 50,
  });

  const filteredCourses = useMemo(() => {
    let list = data?.courses ? [...data.courses] : [];

    // Filter by level
    if (selectedLevel !== "All Levels") {
      list = list.filter((c) =>
        selectedLevel === "Beginner Friendly"
          ? c.level.toLowerCase().includes("beginner") || c.badge?.toLowerCase().includes("beginner")
          : c.level.toLowerCase().includes("intermediate")
      );
    }

    // Filter by price
    if (selectedPrice === "Free to Learn") {
      list = list.filter((c) => c.priceMinor === 0);
    } else if (selectedPrice === "Paid Courses") {
      list = list.filter((c) => c.priceMinor > 0);
    }

    // Sort
    if (sortBy === "rating") {
      list.sort((a, b) => (b.averageRating ?? 5) - (a.averageRating ?? 5));
    } else if (sortBy === "popular") {
      list.sort((a, b) => b.enrollmentCount - a.enrollmentCount);
    } else if (sortBy === "price-asc") {
      list.sort((a, b) => a.priceMinor - b.priceMinor);
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => b.priceMinor - a.priceMinor);
    }

    return list;
  }, [data?.courses, selectedLevel, selectedPrice, sortBy]);

  const hasActiveFilters = category !== "All topics" || selectedLevel !== "All Levels" || selectedPrice !== "All Prices" || query !== "";

  const resetFilters = () => {
    setQuery("");
    setCategory("All topics");
    setSelectedLevel("All Levels");
    setSelectedPrice("All Prices");
    setSortBy("featured");
    setSearchParams({});
  };

  return (
    <section className="catalog wrap">
      <div className="catalog-intro">
        <div className="eyebrow">
          <span className="eyebrow-line" /> THE COMPLETE COURSE CATALOG
        </div>
        <h1>
          Find your next
          <br />
          <em>masterclass.</em>
        </h1>
        <p>
          Explore beginner-friendly courses, hands-on full-stack development, cloud architecture, and design systems with live interactive class studios.
        </p>
        <div className="catalog-search">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by skill, topic, or instructor (e.g. 'React', 'Docker', 'Design systems'…)"
          />
          {query && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setQuery("")}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
          <span>↵</span>
        </div>
      </div>

      <div className="catalog-content">
        {/* Category Pills */}
        <div className="topic-row">
          {topics.map((topic) => (
            <button
              className={category === topic ? "topic active" : "topic"}
              key={topic}
              onClick={() => {
                setCategory(topic);
                if (topic === "All topics") {
                  searchParams.delete("category");
                } else {
                  searchParams.set("category", topic);
                }
                setSearchParams(searchParams);
              }}
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Secondary Filters Bar */}
        <div className="filters-control-bar">
          <div className="filters-group">
            <span className="filters-label">
              <Filter size={13} /> Filter:
            </span>

            {/* Level Selector */}
            <select
              className="filter-select"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              {levels.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>

            {/* Price Selector */}
            <select
              className="filter-select"
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value)}
            >
              {priceOptions.map((pr) => (
                <option key={pr} value={pr}>{pr}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                className="reset-filters-btn"
                onClick={resetFilters}
              >
                <X size={12} /> Clear filters
              </button>
            )}
          </div>

          <div className="sort-group">
            <span className="filters-label">
              <ArrowUpDown size={13} /> Sort by:
            </span>
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            >
              <option value="featured">Featured First</option>
              <option value="rating">Highest Rated (★ 5.0)</option>
              <option value="popular">Most Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="catalog-meta-row">
          <span>Showing <strong>{filteredCourses.length}</strong> masterclasses</span>
          {category !== "All topics" && (
            <span className="catalog-active-filter-tag">
              Category: <strong>{category}</strong>
            </span>
          )}
        </div>

        {isError ? (
          <ErrorPanel message="Courses couldn't load. Check that the API is running and try again." />
        ) : (
          <CourseGrid courses={filteredCourses} loading={isLoading} />
        )}
      </div>
    </section>
  );
}


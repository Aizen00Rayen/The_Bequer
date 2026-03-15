import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CoursesHero from "@/components/courses/CoursesHero";
import CoursesFilters from "@/components/courses/CoursesFilters";
import CoursesGrid from "@/components/courses/CoursesGrid";
import CoursesPromoBanner from "@/components/courses/CoursesPromoBanner";

export interface Category {
  id: number;
  name: string;
  subcategories?: Category[];
}

export interface VideoLesson {
  id: number;
  title: string;
  description: string;
  stream_url: string;
  duration_seconds: number;
  order: number;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  price_dzd: string;
  discount_percent?: number;
  discounted_price?: number;
  start_date: string | null;
  duration: string;
  category: number | null;
  category_details: Category | null;
  cover_image: string | null;
  teacher: number | null;
  teacher_details: { id: number; name: string; username: string } | null;
  videos?: VideoLesson[];
}

const Courses = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchCourses(selectedCategory);
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories/");
      if (res.ok) setCategories(await res.json());
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  const fetchCourses = async (categoryId: number | null) => {
    setLoading(true);
    try {
      const url = categoryId
        ? `/api/courses/?category_id=${categoryId}`
        : "/api/courses/";
      const res = await fetch(url);
      if (res.ok) setCourses(await res.json());
    } catch (error) {
      console.error("Failed to fetch courses", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">
        <CoursesHero />
        <section className="py-12 md:py-20">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-8">
              <aside className="w-full lg:w-1/4">
                <CoursesFilters
                  categories={categories}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                />
              </aside>
              <div className="w-full lg:w-3/4">
                <CoursesGrid courses={courses} loading={loading} />
              </div>
            </div>
          </div>
        </section>
        <CoursesPromoBanner />
      </main>
      <Footer />
    </div>
  );
};

export default Courses;

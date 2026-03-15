import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BooksHero from "@/components/books/BooksHero";
import BooksGrid from "@/components/books/BooksGrid";
import CoursesFilters from "@/components/courses/CoursesFilters";

export interface Category {
    id: number;
    name: string;
    subcategories?: Category[];
}

export interface Book {
    id: number;
    title: string;
    description: string;
    author: string;
    price_dzd: string;
    discount_percent?: number;
    discounted_price?: number;
    category: number | null;
    category_details: Category | null;
    cover_image: string | null;
    book_file: string | null;
    created_at: string;
}

const Books = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchBooks(selectedCategory);
    }, [selectedCategory]);

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories/");
            if (res.ok) setCategories(await res.json());
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    };

    const fetchBooks = async (categoryId: number | null) => {
        setLoading(true);
        try {
            const url = categoryId
                ? `/api/books/?category_id=${categoryId}`
                : "/api/books/";
            const res = await fetch(url);
            if (res.ok) setBooks(await res.json());
        } catch (error) {
            console.error("Failed to fetch books", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />
            <main className="flex-1 pt-20">
                <BooksHero />
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
                                <BooksGrid books={books} loading={loading} />
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default Books;

import { Category } from "@/pages/Courses";
import { Button } from "@/components/ui/button";

interface CoursesFiltersProps {
  categories: Category[];
  selectedCategory: number | null;
  setSelectedCategory: (id: number | null) => void;
}

const CategoryItem = ({ category, selectedCategory, setSelectedCategory, depth = 0 }: {
  category: Category,
  selectedCategory: number | null,
  setSelectedCategory: (id: number | null) => void,
  depth?: number
}) => {
  const isSelected = selectedCategory === category.id;
  const isTopLevel = depth === 0;

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant={isSelected ? "default" : "ghost"}
        className={`justify-start w-full whitespace-normal h-auto text-left ${isSelected
            ? "gradient-primary text-white border-0 shadow-md"
            : isTopLevel
              ? "text-foreground font-medium hover:text-primary hover:bg-muted py-2"
              : "text-muted-foreground hover:text-foreground hover:bg-muted text-sm py-1.5"
          }`}
        onClick={() => setSelectedCategory(category.id)}
      >
        {category.name}
      </Button>
      {category.subcategories && category.subcategories.length > 0 && (
        <div className="flex flex-col gap-1 pl-4 border-l-2 border-border/50 ml-2">
          {category.subcategories.map(sub => (
            <CategoryItem
              key={sub.id}
              category={sub}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CoursesFilters = ({ categories, selectedCategory, setSelectedCategory }: CoursesFiltersProps) => {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm sticky top-24 mb-8 lg:mb-0">
      <h3 className="font-bold text-lg mb-4 text-foreground">Catégories</h3>
      <div className="flex flex-col gap-1.5 h-auto lg:max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 custom-scrollbar">
        <Button
          variant={selectedCategory === null ? "default" : "ghost"}
          className={`justify-start w-full whitespace-normal h-auto py-2 text-left ${selectedCategory === null
            ? "gradient-primary text-white border-0 shadow-md"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          onClick={() => setSelectedCategory(null)}
        >
          Toutes les catégories
        </Button>

        {categories.map((cat) => (
          <CategoryItem
            key={cat.id}
            category={cat}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        ))}
      </div>
    </div>
  );
};

export default CoursesFilters;

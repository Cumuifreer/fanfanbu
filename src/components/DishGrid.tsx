import { DishCard } from './DishCard';
import { EmptyState } from './EmptyState';
import type { Dish } from '../types/dish';

interface DishGridProps {
  dishes: Dish[];
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onSelectDish?: (dish: Dish) => void;
}

export const DishGrid = ({
  dishes,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  onSelectDish,
}: DishGridProps) => {
  if (!dishes.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className="dish-grid">
      {dishes.map((dish) => (
        <DishCard key={dish.id} dish={dish} onSelect={onSelectDish} />
      ))}
    </div>
  );
};

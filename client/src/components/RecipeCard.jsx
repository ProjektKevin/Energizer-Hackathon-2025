import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChefHat, ExternalLink } from "lucide-react";

function RecipeCard({ ingredients, recipes }) {
  if (!ingredients && !recipes) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <ChefHat className="h-5 w-5 text-orange-600" />
          <h3 className="text-xl font-bold text-gray-800">Recipe Suggestions</h3>
        </div>

        {/* Detected Ingredients */}
        {ingredients && ingredients.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Detected Ingredients:
            </p>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ingredient, index) => (
                <Badge key={index} variant="secondary">
                  {ingredient}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {ingredients && recipes && <Separator />}

        {/* Recipe List */}
        {recipes && recipes.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">
              Recommended Recipes:
            </p>
            {recipes.map((recipe, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 shadow-sm border border-orange-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 mb-1">
                      {recipe.name}
                    </h4>
                    {recipe.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {recipe.description}
                      </p>
                    )}
                    {recipe.cookTime && (
                      <p className="text-xs text-gray-500">
                        ⏱️ {recipe.cookTime}
                      </p>
                    )}
                  </div>
                  {recipe.url && (
                    <a
                      href={recipe.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-3 text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export default RecipeCard;
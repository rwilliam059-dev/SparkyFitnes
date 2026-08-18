import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Share2, Sparkles, Star } from 'lucide-react';
import { NutrientGrid } from './NutrientGrid';
import ProviderVerifiedBadge from './ProviderVerifiedBadge';
import AllergenBadges from '@/components/AllergenBadges';
import type { Food } from '@/types/food';
import type { Meal } from '@/types/meal';
import type { UserCustomNutrient } from '@/types/customNutrient';
import { useTranslation } from 'react-i18next';
import { EnergyUnit } from '@/contexts/PreferencesContext';
import { useActiveUser } from '@/contexts/ActiveUserContext';
import { formatServingLabel } from '@/utils/foodServing';
import { resolveFoodImageSrc, usableFoodImages } from '@/utils/foodImages';
import ImageLightbox from './ImageLightbox';
import {
  CONFIDENCE_TONES,
  OVERALL_CONFIDENCE_LABELS,
  type AiConfidence,
  type ConfidenceTone,
} from '@workspace/shared';

const AI_BADGE_TONE_CLASSES: Record<ConfidenceTone, string> = {
  success:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  error: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
};

interface NutrientGridConfig {
  visibleNutrients: string[];
  energyUnit: EnergyUnit;
  convertEnergy: (val: number, from: EnergyUnit, to: EnergyUnit) => number;
  getEnergyUnitString: (unit: EnergyUnit) => string;
  customNutrients: UserCustomNutrient[];
}

interface FoodResultCardProps {
  item: Food | Meal;
  isMeal?: boolean;
  isOnline?: boolean;
  providerLabel?: string;
  providerBadgeColor?: string;
  imageUrl?: string;
  nutrientConfig: NutrientGridConfig;
  onCardClick?: () => void;
  onEditClick?: () => void;
  isFavorite?: boolean;
}

const FoodResultCard = ({
  item,
  isMeal = false,
  isOnline = false,
  providerLabel,
  providerBadgeColor,
  imageUrl,
  nutrientConfig,
  onCardClick,
  onEditClick,
  isFavorite = false,
}: FoodResultCardProps) => {
  const { t } = useTranslation();
  const { activeUserId } = useActiveUser();
  const isFood = !isMeal;
  const foodItem = item as Food;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const fallbackImageSrc = resolveFoodImageSrc(foodItem.image_source_url);
  const galleryImages = (() => {
    const own = usableFoodImages(item.images);
    if (own.length > 0) {
      return own;
    }
    if (thumbnailFailed && fallbackImageSrc) {
      return [fallbackImageSrc];
    }
    const single =
      resolveFoodImageSrc(imageUrl) ?? resolveFoodImageSrc(foodItem.image_url);
    return single ? [single] : [];
  })();
  const resolvedImageSrc = galleryImages[0] ?? null;
  const mealItem = item as Meal;
  const badgeIsHex =
    !!providerBadgeColor &&
    providerBadgeColor.startsWith('#') &&
    providerBadgeColor.length === 7;

  return (
    <Card
      className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${onCardClick ? 'cursor-pointer' : ''}`}
      onClick={onCardClick}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {resolvedImageSrc && (
            <button
              type="button"
              className="self-start shrink-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(true);
              }}
              aria-label={t('food.viewImages', 'View images')}
            >
              <img
                src={resolvedImageSrc}
                alt={item.name}
                className="h-16 w-16 cursor-zoom-in rounded-md object-cover sm:h-14 sm:w-14"
                loading="lazy"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (fallbackImageSrc && !img.dataset['triedFallback']) {
                    img.dataset['triedFallback'] = 'true';
                    img.src = fallbackImageSrc;
                    setThumbnailFailed(true);
                    return;
                  }
                  img.style.display = 'none';
                }}
              />
            </button>
          )}
          <div className="w-full min-w-0 flex-1">
            <div className="mb-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="min-w-0 break-words font-medium">{item.name}</h3>
              {isFood && foodItem.brand && (
                <Badge variant="secondary" className="max-w-full text-xs">
                  {foodItem.brand}
                </Badge>
              )}
              {isMeal && (
                <Badge variant="outline" className="text-xs">
                  {t('enhancedFoodSearch.meal', 'Meal')}
                </Badge>
              )}
              {providerLabel && (
                <Badge
                  variant="outline"
                  className="max-w-full text-xs"
                  style={
                    providerBadgeColor
                      ? {
                          color: providerBadgeColor,
                          borderColor: badgeIsHex
                            ? `${providerBadgeColor}55`
                            : providerBadgeColor,
                          backgroundColor: badgeIsHex
                            ? `${providerBadgeColor}1f`
                            : undefined,
                        }
                      : undefined
                  }
                >
                  {providerLabel}
                </Badge>
              )}
              {isFood && foodItem.provider_verified && (
                <ProviderVerifiedBadge />
              )}
              {isFood &&
                foodItem.default_variant?.source === 'ai_estimate' &&
                foodItem.default_variant.ai_confidence && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${AI_BADGE_TONE_CLASSES[CONFIDENCE_TONES[foodItem.default_variant.ai_confidence as AiConfidence]]}`}
                  >
                    <Sparkles className="mr-1 h-3 w-3" />
                    AI{' '}
                    {
                      OVERALL_CONFIDENCE_LABELS[
                        foodItem.default_variant.ai_confidence as AiConfidence
                      ]
                    }{' '}
                    estimate
                  </Badge>
                )}
              {!isOnline &&
                item.user_id &&
                item.user_id === activeUserId &&
                !(isFood
                  ? foodItem.shared_with_public
                  : mealItem.is_public) && (
                  <Badge variant="outline" className="text-xs">
                    {t('enhancedFoodSearch.private', 'Private')}
                  </Badge>
                )}
              {!isOnline &&
                (isFood ? foodItem.shared_with_public : mealItem.is_public) && (
                  <Badge variant="outline" className="text-xs">
                    <Share2 className="mr-1 h-3 w-3" />
                    {t('enhancedFoodSearch.public', 'Public')}
                  </Badge>
                )}
              {!isOnline &&
                item.user_id &&
                item.user_id !== activeUserId &&
                !(isFood
                  ? foodItem.shared_with_public
                  : mealItem.is_public) && (
                  <Badge variant="outline" className="text-xs">
                    {t('enhancedFoodSearch.family', 'Family')}
                  </Badge>
                )}
              {isFood &&
                foodItem.default_variant?.glycemic_index &&
                foodItem.default_variant.glycemic_index !== 'None' && (
                  <Badge variant="outline" className="text-xs">
                    GI: {foodItem.default_variant.glycemic_index}
                  </Badge>
                )}
            </div>
            {isMeal && mealItem.description && (
              <p className="text-sm text-gray-500">{mealItem.description}</p>
            )}
            {isFood && foodItem.default_variant && (
              <>
                <NutrientGrid
                  food={foodItem.default_variant}
                  visibleNutrients={nutrientConfig.visibleNutrients}
                  energyUnit={nutrientConfig.energyUnit}
                  convertEnergy={nutrientConfig.convertEnergy}
                  getEnergyUnitString={nutrientConfig.getEnergyUnitString}
                  customNutrients={nutrientConfig.customNutrients}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Per {formatServingLabel(foodItem.default_variant)}
                </p>
                <AllergenBadges
                  allergens={foodItem.default_variant.allergens}
                  traces={foodItem.default_variant.traces}
                />
              </>
            )}
          </div>
          <div className="flex w-full items-center gap-2 sm:ml-2 sm:w-auto sm:shrink-0">
            {isFavorite && (
              <Star
                className="h-4 w-4 shrink-0 fill-current text-yellow-500"
                aria-label={t('enhancedFoodSearch.favorite', 'Favorite')}
              />
            )}
            {isOnline && onEditClick && (
              <Button
                size="sm"
                className="w-full sm:w-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick();
                }}
              >
                <Edit className="mr-1 h-4 w-4" />
                {t('enhancedFoodSearch.editAndAdd', 'Edit & Add')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
      <ImageLightbox
        images={galleryImages}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        title={item.name}
      />
    </Card>
  );
};

export default FoodResultCard;

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MiniNutritionTrends from './MiniNutritionTrends';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import {
  getNutrientMetadata,
  formatNutrientValue,
  getNetCarbsValue,
} from '@/utils/nutrientUtils';
import { useNutrientGoalPreferences } from '@/hooks/Settings/useNutrientGoalPreferences';
import type { UserCustomNutrient } from '@/types/customNutrient';
import EditGoalsForToday from '@/pages/Goals/EditGoalsForToday';
import { useMemo, useState } from 'react';
import { DEFAULT_GOALS } from '@/constants/goals';
import { Button } from '@/components/ui/button';
import { ClipboardCopy, History, CheckCircle2, Lightbulb } from 'lucide-react';
import {
  useCopyAllFoodEntriesMutation,
  useCopyAllFoodEntriesFromYesterdayMutation,
} from '@/hooks/Diary/useFoodEntries';
import CopyFoodEntryDialog from './CopyFoodEntryDialog';
import { ExpandedGoals } from '@/types/goals';

export interface DayTotals {
  calories: number; // Stored internally as kcal
  protein: number;
  carbs: number;
  fat: number;
  dietary_fiber: number;
  sugars?: number;
  sodium?: number;
  cholesterol?: number;
  saturated_fat?: number;
  monounsaturated_fat?: number;
  polyunsaturated_fat?: number;
  trans_fat?: number;
  potassium?: number;
  vitamin_a?: number;
  vitamin_c?: number;
  iron?: number;
  calcium?: number;
  custom_nutrients?: Record<string, number>;
}

interface NutritionSummaryCardProps {
  selectedDate: string;
  dayTotals?: DayTotals;
  goals: ExpandedGoals;
  energyUnit: 'kcal' | 'kJ';
  convertEnergy: (
    value: number,
    fromUnit: 'kcal' | 'kJ',
    toUnit: 'kcal' | 'kJ'
  ) => number;
  customNutrients?: UserCustomNutrient[];
}

const NutritionSummaryCard = ({
  selectedDate,
  dayTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, dietary_fiber: 0 },
  goals,
  energyUnit,
  convertEnergy,
  customNutrients = [],
}: NutritionSummaryCardProps) => {
  const { nutrientDisplayPreferences, showNetCarbs } = usePreferences();
  const { data: goalTypePreferences = {} } = useNutrientGoalPreferences();
  const isMobile = useIsMobile();
  const platform = isMobile ? 'mobile' : 'desktop';
  const { t, i18n } = useTranslation();

  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);

  const { mutate: copyAllFromYesterday } =
    useCopyAllFoodEntriesFromYesterdayMutation();
  const { mutate: copyAllToDate } = useCopyAllFoodEntriesMutation();

  const handleCopyAllFromYesterday = () => {
    copyAllFromYesterday({ targetDate: selectedDate });
  };

  const handleCopyAllToDate = (targetDate: string, _targetMealType: string) => {
    copyAllToDate({
      sourceDate: selectedDate,
      targetDate,
    });
  };

  const getEnergyUnitString = (unit: 'kcal' | 'kJ'): string => {
    return unit === 'kcal'
      ? t('common.kcalUnit', 'kcal')
      : t('common.kJUnit', 'kJ');
  };

  const summaryPreferences = nutrientDisplayPreferences.find(
    (p) => p.view_group === 'summary' && p.platform === platform
  );

  const visibleNutrients = useMemo(() => {
    return summaryPreferences
      ? summaryPreferences.visible_nutrients
      : Object.keys(DEFAULT_GOALS);
  }, [summaryPreferences]);

  const goalTips = useMemo(() => {
    const isFrench = (i18n.resolvedLanguage ?? i18n.language ?? '').startsWith(
      'fr'
    );
    const calorieGoal = Number(goals.calories ?? 0);
    const proteinGoal = Number(goals.protein ?? 0);
    const carbsGoal = Number(goals.carbs ?? 0);
    const fatGoal = Number(goals.fat ?? 0);

    const caloriesLeft = Math.max(0, calorieGoal - dayTotals.calories);
    const proteinLeft = Math.max(0, proteinGoal - dayTotals.protein);
    const carbsLeft = Math.max(0, carbsGoal - dayTotals.carbs);
    const fatLeft = Math.max(0, fatGoal - dayTotals.fat);

    const proteinMissing =
      proteinGoal > 0 && proteinLeft >= Math.max(10, proteinGoal * 0.12);
    const carbsMissing =
      carbsGoal > 0 && carbsLeft >= Math.max(15, carbsGoal * 0.12);
    const fatMissing = fatGoal > 0 && fatLeft >= Math.max(6, fatGoal * 0.12);
    const fatNearlyFull = fatGoal > 0 && dayTotals.fat >= fatGoal * 0.9;
    const calorieNearlyFull =
      calorieGoal > 0 && caloriesLeft <= Math.max(120, calorieGoal * 0.06);

    const tips: string[] = [];

    if (
      calorieGoal <= 0 &&
      proteinGoal <= 0 &&
      carbsGoal <= 0 &&
      fatGoal <= 0
    ) {
      return [];
    }

    if (calorieNearlyFull && (proteinMissing || carbsMissing || fatMissing)) {
      tips.push(
        isFrench
          ? `Tu es proche de ton objectif calorique. Ne cherche pas à remplir toutes les macros à tout prix aujourd’hui.`
          : `You are close to your calorie goal. Do not force every macro target at the expense of calories today.`
      );
    }

    if (proteinMissing) {
      if (fatNearlyFull) {
        tips.push(
          isFrench
            ? `Il te manque environ ${Math.round(proteinLeft)} g de protéines et tes lipides sont presque atteints : privilégie skyr, fromage blanc allégé, poulet, thon au naturel ou blancs d’œufs.`
            : `You are about ${Math.round(proteinLeft)} g short on protein and fat is nearly full: favor lean options such as skyr, low-fat yogurt, chicken, tuna in water or egg whites.`
        );
      } else {
        tips.push(
          isFrench
            ? `Il te manque environ ${Math.round(proteinLeft)} g de protéines : pense à une source protéinée au prochain repas ou en collation.`
            : `You are about ${Math.round(proteinLeft)} g short on protein: add a protein-rich food to your next meal or snack.`
        );
      }
    }

    if (carbsMissing && !calorieNearlyFull) {
      tips.push(
        isFrench
          ? `Il te reste environ ${Math.round(carbsLeft)} g de glucides : fruits, riz, pommes de terre, avoine ou pain peuvent compléter facilement la journée.`
          : `You have about ${Math.round(carbsLeft)} g of carbs left: fruit, rice, potatoes, oats or bread can help round out the day.`
      );
    }

    if (fatMissing && !calorieNearlyFull && !fatNearlyFull) {
      tips.push(
        isFrench
          ? `Il te manque environ ${Math.round(fatLeft)} g de lipides : une petite portion de noix, avocat, œufs ou huile d’olive peut suffire.`
          : `You have about ${Math.round(fatLeft)} g of fat left: a small portion of nuts, avocado, eggs or olive oil may be enough.`
      );
    }

    if (
      tips.length === 0 &&
      calorieGoal > 0 &&
      caloriesLeft > Math.max(180, calorieGoal * 0.08)
    ) {
      tips.push(
        isFrench
          ? `Il te reste environ ${Math.round(caloriesLeft)} kcal. Une collation équilibrée avec protéines + glucides est un bon moyen de te rapprocher de tes objectifs.`
          : `You have about ${Math.round(caloriesLeft)} kcal left. A balanced protein + carb snack is a simple way to move closer to your goals.`
      );
    }

    if (tips.length === 0) {
      tips.push(
        isFrench
          ? `Tes objectifs principaux sont bien couverts aujourd’hui. Continue simplement à écouter ta faim et ta satiété.`
          : `Your main nutrition targets are well covered today. Keep following your hunger and fullness cues.`
      );
    }

    return tips.slice(0, 3);
  }, [dayTotals, goals, i18n.language, i18n.resolvedLanguage]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg dark:text-slate-300">
            {t('diary.nutritionSummary', 'Nutrition Summary')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsCopyDialogOpen(true)}
              title={t('diary.copyAllToDate', 'Copy entire day to date')}
            >
              <ClipboardCopy className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleCopyAllFromYesterday}
              title={t('diary.copyAllFromYesterday', 'Copy all from yesterday')}
            >
              <History className="h-4 w-4" />
            </Button>
            <EditGoalsForToday selectedDate={selectedDate} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div
          className="grid gap-x-4 gap-y-6"
          style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '80px' : '120px'}, 1fr))`,
          }}
        >
          {visibleNutrients.map((nutrient) => {
            const metadata = getNutrientMetadata(
              nutrient,
              customNutrients,
              goalTypePreferences
            );
            const total =
              (dayTotals[nutrient as keyof DayTotals] as number) ??
              dayTotals.custom_nutrients?.[nutrient] ??
              0;
            const displayNutrient =
              nutrient === 'carbs' && showNetCarbs ? 'net_carbs' : nutrient;
            const comparisonTotal =
              nutrient === 'carbs' && showNetCarbs
                ? getNetCarbsValue(dayTotals.carbs, dayTotals.dietary_fiber)
                : total;
            const rawGoal = goals[nutrient as keyof ExpandedGoals];
            const goal =
              typeof rawGoal === 'number'
                ? rawGoal
                : (goals.custom_nutrients?.[nutrient] ?? 0);

            const displayTotal =
              nutrient === 'calories'
                ? Math.round(
                    convertEnergy(comparisonTotal, 'kcal', energyUnit)
                  ).toString()
                : formatNutrientValue(
                    nutrient,
                    comparisonTotal,
                    customNutrients
                  );

            const displayGoal =
              nutrient === 'calories'
                ? Math.round(convertEnergy(goal, 'kcal', energyUnit)).toString()
                : formatNutrientValue(nutrient, goal, customNutrients);

            const unit =
              nutrient === 'calories'
                ? getEnergyUnitString(energyUnit)
                : metadata.unit;

            const label =
              displayNutrient === 'net_carbs'
                ? t('nutrition.netCarbs', 'Net Carbs')
                : t(metadata.label, metadata.defaultLabel);

            const goalType = metadata.goalType;
            const isOverLimit =
              goalType === 'maximum' && goal > 0 && comparisonTotal > goal;
            const inTargetRange =
              goalType === 'target' &&
              metadata.targetMin !== undefined &&
              metadata.targetMax !== undefined &&
              comparisonTotal >= metadata.targetMin &&
              comparisonTotal <= metadata.targetMax;
            const isTargetType =
              goalType === 'target' &&
              metadata.targetMin !== undefined &&
              metadata.targetMax !== undefined;

            const colorClass = isOverLimit
              ? 'text-red-600'
              : isTargetType && !inTargetRange
                ? 'text-amber-600'
                : metadata.color;

            const barColor = isOverLimit
              ? '#ef4444'
              : isTargetType && !inTargetRange
                ? '#f59e0b'
                : metadata.chartColor;

            const targetMinVal =
              nutrient === 'calories' && metadata.targetMin !== undefined
                ? Math.round(
                    convertEnergy(metadata.targetMin, 'kcal', energyUnit)
                  )
                : metadata.targetMin;

            const targetMaxVal =
              nutrient === 'calories' && metadata.targetMax !== undefined
                ? Math.round(
                    convertEnergy(metadata.targetMax, 'kcal', energyUnit)
                  )
                : metadata.targetMax;

            const percentage =
              goal > 0 ? Math.min((comparisonTotal / goal) * 100, 100) : 0;

            const subLine = isTargetType
              ? `${formatNutrientValue(nutrient, targetMinVal, customNutrients)}–${formatNutrientValue(nutrient, targetMaxVal, customNutrients)}${unit}`
              : goalType === 'maximum' && isOverLimit
                ? `${formatNutrientValue(nutrient, comparisonTotal - goal, customNutrients)}${unit} ${t('diary.over', 'over')}`
                : `${t('diary.of', 'of')} ${displayGoal}${unit}`;

            const showCheck =
              (goalType === 'maximum' && goal > 0 && !isOverLimit) ||
              (isTargetType && inTargetRange);

            return (
              <div key={nutrient} className="text-center">
                <div
                  className={`text-lg sm:text-xl font-bold ${colorClass} flex items-center justify-center gap-1`}
                >
                  {displayTotal}
                  {unit}
                  {showCheck && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div className="text-xs text-gray-500 leading-tight">
                  {subLine}
                </div>
                <div
                  className="text-xs text-gray-500 truncate w-full"
                  title={label}
                >
                  {label}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {goalTips.length > 0 && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-900/60 dark:bg-amber-950/20">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
              <Lightbulb className="h-4 w-4" />
              <span>
                {(i18n.resolvedLanguage ?? i18n.language ?? '').startsWith('fr')
                  ? 'Conseils pour atteindre tes objectifs'
                  : 'Tips to reach your goals'}
              </span>
            </div>
            <div className="space-y-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              {goalTips.map((tip) => (
                <div key={tip} className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <MiniNutritionTrends
          selectedDate={selectedDate}
          customNutrients={customNutrients}
        />
      </CardContent>

      <CopyFoodEntryDialog
        isOpen={isCopyDialogOpen}
        onClose={() => setIsCopyDialogOpen(false)}
        onCopy={handleCopyAllToDate}
        sourceMealType="all"
      />
    </Card>
  );
};

export default NutritionSummaryCard;

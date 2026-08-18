import { useCallback } from 'react';
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { searchFoodsV2 } from '@/api/Foods/foodService';
import { searchNutritionixFoods } from '@/api/Foods/nutrionix';
import { convertNutritionixToFood } from '@/utils/foodSearch';
import { useDebounce } from '@/hooks/useDebounce';
import type { Food, NutritionixItem } from '@/types/food';
import type { DataProvider } from '@/types/settings';

export type ExternalResultWrapper =
  | {
      provider_type: 'openfoodfacts';
      food: Food;
    }
  | {
      provider_type: 'nutritionix';
      raw: NutritionixItem;
      food: Food;
    }
  | {
      provider_type: 'fatsecret';
      food: Food;
    }
  | {
      provider_type: 'usda';
      food: Food;
    }
  | {
      provider_type: 'mealie';
      food: Food;
    }
  | {
      provider_type: 'tandoor';
      food: Food;
    }
  | {
      provider_type: 'yazio';
      food: Food;
    }
  | {
      provider_type: 'norish';
      food: Food;
    }
  | {
      provider_type: 'swissfood';
      food: Food;
    };

interface NormalisedProviderResult {
  items: ExternalResultWrapper[];
  totalCount: number;
}

export interface ProviderFoodSearchResult {
  provider: DataProvider;
  items: ExternalResultWrapper[];
  totalCount: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const MIN_QUERY_LENGTH = 3;
const DEFAULT_DEBOUNCE_MS = 600;
// Open Food Facts is much more sensitive to repeated live-search calls than
// local providers. When it participates in the fan-out, wait for the user to
// finish typing before firing the whole batch.
const OFF_DEBOUNCE_MS = 1400;
const STALE_TIME = 1000 * 60 * 5;

const noop = () => {};

const allProvidersFoodSearchKey = (
  providerType: string,
  query: string,
  providerId?: string,
  autoScale?: boolean
) =>
  [
    'v2',
    'foods',
    'allProvidersSearch',
    providerType,
    query,
    providerId,
    autoScale,
  ] as const;

const PAGE_SIZE_PROVIDERS = ['usda', 'yazio'];

async function fetchProviderResults(
  provider: DataProvider,
  query: string,
  options: { autoScale?: boolean; foodDisplayLimit?: number }
): Promise<NormalisedProviderResult> {
  if (provider.provider_type === 'nutritionix') {
    const data: NutritionixItem[] = await searchNutritionixFoods(
      query,
      provider.id
    );
    const items = (Array.isArray(data) ? data : []).map(
      (raw) =>
        ({
          provider_type: 'nutritionix' as const,
          raw,
          food: convertNutritionixToFood(raw),
        }) satisfies ExternalResultWrapper
    );
    return { items, totalCount: items.length };
  }

  const pageSize = PAGE_SIZE_PROVIDERS.includes(provider.provider_type)
    ? options.foodDisplayLimit
    : undefined;
  const data = await searchFoodsV2(
    provider.provider_type,
    query,
    provider.id,
    undefined,
    pageSize,
    provider.provider_type === 'openfoodfacts' ? options.autoScale : undefined
  );
  const items = (Array.isArray(data?.foods) ? data.foods : []).map(
    (food: Food) =>
      ({
        provider_type: provider.provider_type,
        food,
      }) as ExternalResultWrapper
  );
  return {
    items,
    totalCount: data?.pagination?.totalCount ?? items.length,
  };
}

export function useAllProvidersFoodSearch(
  searchTerm: string,
  providers: DataProvider[],
  options?: {
    enabled?: boolean;
    autoScale?: boolean;
    foodDisplayLimit?: number;
  }
): {
  providerResults: ProviderFoodSearchResult[];
  anyLoading: boolean;
  isSearchActive: boolean;
  debouncedSearch: string;
} {
  const { enabled = true, autoScale, foodDisplayLimit } = options ?? {};
  const includesOpenFoodFacts = providers.some(
    (provider) => provider.provider_type === 'openfoodfacts'
  );
  const debounceMs = includesOpenFoodFacts
    ? OFF_DEBOUNCE_MS
    : DEFAULT_DEBOUNCE_MS;
  const debouncedSearch = useDebounce(searchTerm.trim(), debounceMs);
  const isSearchActive =
    searchTerm.trim().length >= MIN_QUERY_LENGTH &&
    debouncedSearch.length >= MIN_QUERY_LENGTH;

  const combine = useCallback(
    (
      results: UseQueryResult<NormalisedProviderResult>[]
    ): ProviderFoodSearchResult[] =>
      providers.map((provider, i) => {
        const q = results[i];
        const items = q?.data?.items ?? [];
        return {
          provider,
          items,
          totalCount: q?.data?.totalCount ?? 0,
          isLoading: (q?.isFetching ?? false) && items.length === 0,
          isError: q?.isError ?? false,
          refetch: q?.refetch ?? noop,
        };
      }),
    [providers]
  );

  const providerResults = useQueries({
    queries: providers.map((provider) => ({
      queryKey: allProvidersFoodSearchKey(
        provider.provider_type,
        debouncedSearch,
        provider.id,
        autoScale
      ),
      queryFn: () =>
        fetchProviderResults(provider, debouncedSearch, {
          autoScale,
          foodDisplayLimit,
        }),
      enabled: isSearchActive && enabled,
      staleTime: STALE_TIME,
      // A provider rejecting a search should not be hammered again
      // automatically; the UI already exposes an explicit refetch action.
      retry: false,
    })),
    combine,
  });

  const isDebouncePending =
    enabled &&
    searchTerm.trim().length >= MIN_QUERY_LENGTH &&
    searchTerm.trim() !== debouncedSearch;
  const anyLoading =
    providerResults.some((r) => r.isLoading) || isDebouncePending;

  return { providerResults, isSearchActive, anyLoading, debouncedSearch };
}

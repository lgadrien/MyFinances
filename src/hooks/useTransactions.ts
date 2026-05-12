import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  fetchTransactions,
  insertTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/data";
import { useSettingsStore } from "@/stores/useSettingsStore";

export function useTransactions() {
  const queryClient = useQueryClient();
  const environment = useSettingsStore((s) => s.environment);

  const query = useQuery({
    queryKey: ["transactions", environment],
    queryFn: () => fetchTransactions(environment),
    staleTime: 5 * 60 * 1000,
  });

  const transactions = useMemo(() => query.data || [], [query.data]);

  const addTx = useMutation({
    mutationFn: (tx: Parameters<typeof insertTransaction>[0]) => insertTransaction({ ...tx, environment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", environment] });
    },
  });

  const updateTx = useMutation({
    mutationFn: ({ id, tx }: { id: string; tx: any }) => updateTransaction(id, tx),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", environment] });
    },
  });

  const deleteTx = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", environment] });
    },
  });

  return {
    transactions,
    isLoading: query.isLoading,
    isError: query.isError,
    addTransaction: addTx.mutateAsync,
    updateTransaction: updateTx.mutateAsync,
    deleteTransaction: deleteTx.mutateAsync,
  };
}

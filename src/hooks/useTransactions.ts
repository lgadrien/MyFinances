import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  fetchTransactions,
  insertTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/data";

export function useTransactions() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
    staleTime: 5 * 60 * 1000,
  });

  const transactions = useMemo(() => query.data || [], [query.data]);

  const addTx = useMutation({
    mutationFn: insertTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const updateTx = useMutation({
    mutationFn: ({ id, tx }: { id: string; tx: any }) => updateTransaction(id, tx),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const deleteTx = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
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

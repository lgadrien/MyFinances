import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTransactions,
  insertTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/data";

export function useTransactions() {
  const queryClient = useQueryClient();

  // Fetch transactions with caching
  const query = useQuery({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Mutations
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
    transactions: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    addTransaction: addTx.mutateAsync,
    updateTransaction: updateTx.mutateAsync,
    deleteTransaction: deleteTx.mutateAsync,
  };
}

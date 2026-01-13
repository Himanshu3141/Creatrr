import { useQuery, useMutation } from "convex/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface UseConvexQueryReturn<Data> {
  data: Data | undefined;
  isLoading: boolean;
  error: Error | null;
}

interface UseConvexMutationReturn<Args extends any[], Data> {
  mutate: (...args: Args) => Promise<Data>;
  data: Data | undefined;
  isLoading: boolean;
  error: Error | null;
}


export function useConvexQuery<Data = any>(
 
  query: any,
  
  ...args: any[]
): UseConvexQueryReturn<Data> {
  const result = useQuery(
    query,
    ...(args.length > 0 ? [args[0]] : [])
  ) as Data | undefined;
  const [data, setData] = useState<Data | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Use effect to handle the state changes based on the query result
  useEffect(() => {
    if (result === undefined) {
      setIsLoading(true);
    } else {
      try {
        setData(result);
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    }
  }, [result]);

  return {
    data,
    isLoading,
    error,
  };
}


export function useConvexMutation<Data = any>(
  
  mutation: any
): UseConvexMutationReturn<any[], Data> {
  
  const mutationFn = useMutation(mutation);
  const [data, setData] = useState<Data | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  
  const mutate = async (...args: any[]): Promise<Data> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = (await (args.length > 0
        ? mutationFn(args[0])
        : mutationFn())) as Data;
      setData(response);
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, data, isLoading, error };
}
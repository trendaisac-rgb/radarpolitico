/**
 * RadarPolítico - Hook para Políticos
 * Gerencia CRUD de políticos monitorados
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { Politician, Insertable, Updatable } from '@/integrations/supabase/types'

// Buscar todos os políticos do usuário
export function usePoliticians() {
  return useQuery({
    queryKey: ['politicians'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('politicians')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Politician[]
    }
  })
}

// Buscar um político específico
export function usePolitician(id: number) {
  return useQuery({
    queryKey: ['politicians', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('politicians')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Politician
    },
    enabled: !!id
  })
}

// Criar novo político
export function useCreatePolitician() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (politician: Insertable<'politicians'>) => {
      const { data, error } = await supabase
        .from('politicians')
        .insert(politician)
        .select()
        .single()

      if (error) throw error
      return data as Politician
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['politicians'] })
    }
  })
}

// Atualizar político
export function useUpdatePolitician() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Updatable<'politicians'> & { id: number }) => {
      const { data, error } = await supabase
        .from('politicians')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Politician
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['politicians'] })
      queryClient.invalidateQueries({ queryKey: ['politicians', data.id] })
    }
  })
}

// Deletar político
export function useDeletePolitician() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('politicians')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['politicians'] })
    }
  })
}

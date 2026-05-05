export type UserRole = 'admin' | 'user'
export type ScheduleStatus = 'pendente' | 'aprovado' | 'recusado' | 'cancelado'
export type Turno = 'manha' | 'tarde' | 'noite'
export type NotificacaoTipo = 'agendamento' | 'login' | 'cancelamento'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}
 
export interface Carrinho {
  id: string
  nome: string
  is_active: boolean
  created_at: string
}
 
export interface Local {
  id: string
  nome: string
  descricao: string | null
  is_active: boolean
  created_at: string
}
 
export interface Agendamento {
  id: string
  usuario_id: string
  carrinho_id: string
  local_id: string
  data: string           // 'YYYY-MM-DD'
  turno: Turno
  status: ScheduleStatus
  observacao: string | null
  obs_admin: string | null
  created_at: string
  updated_at: string
  // joins opcionais
  profiles?: Profile
  carrinhos?: Carrinho
  locais?: Local
}
 
export interface Notificacao {
  id: string
  tipo: NotificacaoTipo
  titulo: string
  mensagem: string
  usuario_id: string | null
  agendamento_id: string | null
  lida: boolean
  created_at: string
  profiles?: Profile
}
 
// ── Tipagem do Supabase client ────────────────────────────────
 
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      carrinhos: {
        Row: Carrinho
        Insert: Omit<Carrinho, 'id' | 'created_at'>
        Update: Partial<Omit<Carrinho, 'id' | 'created_at'>>
      }
      locais: {
        Row: Local
        Insert: Omit<Local, 'id' | 'created_at'>
        Update: Partial<Omit<Local, 'id' | 'created_at'>>
      }
      agendamentos: {
        Row: Agendamento
        Insert: Omit<Agendamento, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Agendamento, 'id' | 'usuario_id' | 'created_at'>>
      }
      notificacoes: {
        Row: Notificacao
        Insert: Omit<Notificacao, 'id' | 'created_at'>
        Update: Partial<Pick<Notificacao, 'lida'>>
      }
    }
    Views: {
      disponibilidade: {
        Row: {
          carrinho_id: string
          carrinho_nome: string
          data: string | null
          turno: Turno | null
          status: ScheduleStatus | null
          agendamento_id: string | null
          usuario_nome: string | null
          local_nome: string | null
        }
      }
    }
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean }
      pode_cancelar: { Args: { p_data: string; p_turno: string }; Returns: boolean }
    }
  }
}
 
// ── Constantes de turno ───────────────────────────────────────
 
export const TURNOS: Record<Turno, { label: string; inicio: string; fim: string; emoji: string }> = {
  manha: { label: 'Manhã',  inicio: '07:00', fim: '12:00', emoji: '🌅' },
  tarde: { label: 'Tarde',  inicio: '12:00', fim: '18:00', emoji: '☀️' },
  noite: { label: 'Noite',  inicio: '18:00', fim: '23:00', emoji: '🌙' },
}
 
export const STATUS_CONFIG: Record<ScheduleStatus, { label: string; color: string }> = {
  pendente:  { label: 'Aguardando', color: 'text-amber-400 bg-amber-950 border-amber-800' },
  aprovado:  { label: 'Aprovado',   color: 'text-green-400 bg-green-950 border-green-800' },
  recusado:  { label: 'Recusado',   color: 'text-red-400 bg-red-950 border-red-800'       },
  cancelado: { label: 'Cancelado',  color: 'text-zinc-400 bg-zinc-800 border-zinc-700'    },
}
 
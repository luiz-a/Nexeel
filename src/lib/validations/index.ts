import { z } from 'zod'

export const loginSchema = z.object({
  email:    z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export const agendamentoSchema = z.object({
  data: z.date({ required_error: 'Selecione uma data' }).refine(
    d => { const hoje = new Date(); hoje.setHours(0,0,0,0); return d >= hoje },
    { message: 'Data não pode ser no passado' }
  ),
  turno:       z.enum(['manha', 'tarde', 'noite'], { required_error: 'Selecione um turno' }),
  carrinho_id: z.string().uuid('Selecione um carrinho'),
  local_id:    z.string().uuid('Selecione um local'),
  observacao:  z.string().max(300, 'Máximo 300 caracteres').optional(),
})

export const revisarAgendamentoSchema = z.object({
  status:    z.enum(['aprovado', 'recusado']),
  obs_admin: z.string().max(300).optional(),
})

export const criarUsuarioSchema = z.object({
  email:     z.string().email('E-mail inválido'),
  password:  z.string()
               .min(8, 'Mínimo 8 caracteres')
               .regex(/[A-Z]/, 'Precisa de pelo menos uma maiúscula')
               .regex(/[0-9]/, 'Precisa de pelo menos um número'),
  full_name: z.string().min(3, 'Nome muito curto').max(60, 'Nome muito longo'),
})

export const carrinhoSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório').max(50),
})

export const localSchema = z.object({
  nome:      z.string().min(1, 'Nome obrigatório').max(80),
  descricao: z.string().max(200).optional(),
})

export type LoginFormData            = z.infer<typeof loginSchema>
export type AgendamentoFormData      = z.infer<typeof agendamentoSchema>
export type RevisarAgendamentoData   = z.infer<typeof revisarAgendamentoSchema>
export type CriarUsuarioFormData     = z.infer<typeof criarUsuarioSchema>
export type CarrinhoFormData         = z.infer<typeof carrinhoSchema>
export type LocalFormData            = z.infer<typeof localSchema>
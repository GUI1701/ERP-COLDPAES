import prisma from '../../lib/prisma'

export function validarCliente(data: { nome?: string }): void {
  if (!data.nome?.trim()) throw new Error('Nome é obrigatório')
}

export function calcularTicketMedio(total: number, quantidade: number): number {
  if (quantidade === 0) return 0
  return total / quantidade
}

export async function listarClientes(apenasAtivos = true) {
  return prisma.cliente.findMany({
    where: apenasAtivos ? { ativo: true } : undefined,
    orderBy: { nome: 'asc' },
  })
}

export async function buscarCliente(id: string) {
  return prisma.cliente.findUniqueOrThrow({ where: { id } })
}

export async function criarCliente(data: {
  nome: string
  telefone?: string
  email?: string
  cidade?: string
  observacao?: string
}) {
  validarCliente(data)
  return prisma.cliente.create({ data })
}

export async function atualizarCliente(id: string, data: {
  nome?: string
  telefone?: string
  email?: string
  cidade?: string
  observacao?: string
  ativo?: boolean
}) {
  if (data.nome !== undefined) validarCliente({ nome: data.nome })
  return prisma.cliente.update({ where: { id }, data })
}

export async function desativarCliente(id: string) {
  return prisma.cliente.update({ where: { id }, data: { ativo: false } })
}

export async function getResumoCliente(id: string) {
  const cliente = await prisma.cliente.findUniqueOrThrow({ where: { id } })
  const vendas = await prisma.venda.findMany({
    where: { clienteId: id },
    orderBy: { data: 'desc' },
    select: { total: true, data: true },
  })
  const totalVendido = vendas.reduce((acc, v) => acc + Number(v.total), 0)
  const quantidadePedidos = vendas.length
  return {
    cliente,
    totalVendido,
    quantidadePedidos,
    ultimaVenda: vendas[0]?.data ?? null,
    ticketMedio: calcularTicketMedio(totalVendido, quantidadePedidos),
  }
}

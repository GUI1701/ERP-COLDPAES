import prisma from '../../lib/prisma'

export function validarFornecedor(data: { nome?: string }): void {
  if (!data.nome?.trim()) throw new Error('Nome é obrigatório')
}

export function calcularTicketMedio(total: number, quantidade: number): number {
  if (quantidade === 0) return 0
  return total / quantidade
}

export async function listarFornecedores(apenasAtivos = true) {
  return prisma.fornecedor.findMany({
    where: apenasAtivos ? { ativo: true } : undefined,
    orderBy: { nome: 'asc' },
  })
}

export async function buscarFornecedor(id: string) {
  return prisma.fornecedor.findUniqueOrThrow({ where: { id } })
}

export async function criarFornecedor(data: {
  nome: string
  telefone?: string
  email?: string
  cidade?: string
  observacao?: string
}) {
  validarFornecedor(data)
  return prisma.fornecedor.create({ data })
}

export async function atualizarFornecedor(id: string, data: {
  nome?: string
  telefone?: string
  email?: string
  cidade?: string
  observacao?: string
  ativo?: boolean
}) {
  if (data.nome !== undefined) validarFornecedor({ nome: data.nome })
  return prisma.fornecedor.update({ where: { id }, data })
}

export async function desativarFornecedor(id: string) {
  return prisma.fornecedor.update({ where: { id }, data: { ativo: false } })
}

export async function getResumoFornecedor(id: string) {
  const fornecedor = await prisma.fornecedor.findUniqueOrThrow({ where: { id } })
  const compras = await prisma.compra.findMany({
    where: { fornecedorId: id },
    orderBy: { data: 'desc' },
    select: { total: true, data: true },
  })
  const totalComprado = compras.reduce((acc, c) => acc + Number(c.total), 0)
  const quantidadeCompras = compras.length
  return {
    fornecedor,
    totalComprado,
    quantidadeCompras,
    ultimaCompra: compras[0]?.data ?? null,
    ticketMedio: calcularTicketMedio(totalComprado, quantidadeCompras),
  }
}

import prisma from '../config/prisma';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerQuery,
  CreateFollowUpInput,
} from '../validators/customer.validator';

export async function listCustomers(query: CustomerQuery) {
  const { page, limit, search, status, customerType } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(status && { status }),
    ...(customerType && { customerType }),
    ...(search && {
      OR: [
        { customerName: { contains: search, mode: 'insensitive' as const } },
        { mobile: { contains: search } },
        { businessName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        customerName: true,
        mobile: true,
        email: true,
        businessName: true,
        customerType: true,
        status: true,
        followUpDate: true,
        createdAt: true,
        createdBy: { select: { id: true, name: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    customers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { followUps: true, challans: true } },
    },
  });

  if (!customer) throw new Error('Customer not found');
  return customer;
}

export async function createCustomer(data: CreateCustomerInput, userId: string) {
  return prisma.customer.create({
    data: {
      ...data,
      email: data.email || null,
      gstNumber: data.gstNumber || null,
      followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      notes: data.notes || null,
      createdById: userId,
    },
  });
}

export async function updateCustomer(id: string, data: UpdateCustomerInput) {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) throw new Error('Customer not found');

  return prisma.customer.update({
    where: { id },
    data: {
      ...data,
      email: data.email === '' ? null : data.email,
      gstNumber: data.gstNumber === '' ? null : data.gstNumber,
      followUpDate: data.followUpDate
        ? new Date(data.followUpDate)
        : data.followUpDate === ''
        ? null
        : undefined,
      notes: data.notes === '' ? null : data.notes,
    },
  });
}

export async function addFollowUp(
  customerId: string,
  data: CreateFollowUpInput,
  userId: string
) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new Error('Customer not found');

  return prisma.followUp.create({
    data: {
      note: data.note,
      followUpDate: new Date(data.followUpDate),
      customerId,
      createdById: userId,
    },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export async function getFollowUps(customerId: string) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new Error('Customer not found');

  return prisma.followUp.findMany({
    where: { customerId },
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });
}

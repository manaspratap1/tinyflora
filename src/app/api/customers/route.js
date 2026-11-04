import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized. Admin privileges required." },
      { status: 403 }
    );
  }

  try {
    const users = await prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        orders: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const customers = users.map((u) => {
      const ordersCount = u.orders.length;
      const totalSpent = u.orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      const lastOrder = u.orders[0];

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || "—",
        ordersCount,
        totalSpent: Number(totalSpent.toFixed(2)),
        lastOrderDate: lastOrder ? lastOrder.createdAt : null,
        joinedDate: u.createdAt,
      };
    });

    return NextResponse.json({ customers, total: customers.length });
  } catch (error) {
    console.error("Get customers database error:", error);
    return NextResponse.json(
      { message: "Internal server error: Database service unavailable" },
      { status: 500 }
    );
  }
}


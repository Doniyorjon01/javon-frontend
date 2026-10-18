"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useT } from "@/components/app";
import { OrderDetail } from "@/components/admin/order-detail";
import { useStore } from "@/components/admin/store";
import { IBack } from "@/components/icons";

export default function OrderPage() {
  const d = useT();
  const { base } = useStore();
  const { orderId } = useParams<{ orderId: string }>();
  return (
    <div className="stack" style={{ maxWidth: 720 }}>
      <Link href={`${base}/orders`} className="btn-link row" style={{ gap: 6 }}>
        <IBack size={16} /> {d.orders.title}
      </Link>
      <div className="card">
        <OrderDetail orderId={Number(orderId)} full />
      </div>
    </div>
  );
}

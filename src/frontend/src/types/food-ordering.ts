import type { Principal } from "@dfinity/principal";

export interface ConcessionStand {
  id: string;
  name: string;
  imageUrl?: string;
}

export interface MenuItem {
  id: string;
  standId: string;
  name: string;
  priceCents: bigint;
  description: string;
  imageUrl?: string;
}

export enum OrderStatus {
  Placed = "Placed",
  Preparing = "Preparing",
  ReadyForPickup = "ReadyForPickup",
  OnTheWay = "OnTheWay",
  Completed = "Completed",
  Cancelled = "Cancelled",
}

export enum DeliveryMethod {
  Delivery = "Delivery",
  Pickup = "Pickup",
}

export interface OrderItem {
  menuItemId: string;
  itemName: string;
  quantity: number;
  priceCents: bigint;
}

export interface FoodOrder {
  id: string;
  fanId: Principal;
  standId: string;
  items: OrderItem[];
  seatNumber: string;
  deliveryMethod: DeliveryMethod;
  status: OrderStatus;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}
